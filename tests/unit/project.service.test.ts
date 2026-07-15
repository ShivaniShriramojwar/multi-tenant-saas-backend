import {
  deleteProjectService,
  getProjectByIdService,
} from "../../src/modules/project/project.service";
import {
  deleteProjectById,
  getProjectById,
} from "../../src/modules/project/project.repository";
import { countTasksByProject } from "../../src/modules/task/task.repository";
import { countBugsByProject } from "../../src/modules/bug/bug.repository";
import { deleteCommentsByEntity } from "../../src/modules/comment/comment.repository";
import { createAuditLog } from "../../src/modules/audit/audit.service";
import { emitTenantNotification } from "../../src/infrastructure/socket/socket";
import { tenantAId, tenantBId, superAdminId } from "../fixtures/auth.fixture";

jest.mock("../../src/modules/project/project.repository", () => ({
  createProject: jest.fn(),
  deleteProjectById: jest.fn(),
  getProjectById: jest.fn(),
  getProjectsByTenant: jest.fn(),
  updateProjectById: jest.fn(),
}));

jest.mock("../../src/modules/task/task.repository", () => ({
  countTasksByProject: jest.fn(),
}));

jest.mock("../../src/modules/bug/bug.repository", () => ({
  countBugsByProject: jest.fn(),
}));

jest.mock("../../src/modules/comment/comment.repository", () => ({
  deleteCommentsByEntity: jest.fn(),
}));

jest.mock("../../src/modules/audit/audit.service", () => ({
  createAuditLog: jest.fn(),
}));

jest.mock("../../src/infrastructure/socket/socket", () => ({
  emitTenantNotification: jest.fn(),
}));

const projectId = "64f000000000000000000201";

const project = (tenantId = tenantAId) => ({
  _id: projectId,
  tenantId: {
    _id: tenantId,
    toString: () => tenantId,
  },
  name: "Platform",
  status: "ACTIVE",
});

describe("project service tenant isolation and deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when Tenant A requests Tenant B project", async () => {
    (getProjectById as jest.Mock).mockResolvedValue(project(tenantBId));

    await expect(getProjectByIdService(projectId, tenantAId)).rejects.toMatchObject({
      message: "Project not found",
      statusCode: 404,
    });
  });

  it("does not delete a project that still has dependent tasks or bugs", async () => {
    (getProjectById as jest.Mock).mockResolvedValue(project(tenantAId));
    (countTasksByProject as jest.Mock).mockResolvedValue(2);
    (countBugsByProject as jest.Mock).mockResolvedValue(1);

    await expect(
      deleteProjectService(projectId, tenantAId, superAdminId),
    ).rejects.toMatchObject({
      message: "Project cannot be deleted while it has tasks or bugs",
      statusCode: 409,
      details: {
        tasks: 2,
        bugs: 1,
      },
    });

    expect(deleteCommentsByEntity).not.toHaveBeenCalled();
    expect(deleteProjectById).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("deletes project comments, project record, notification, and audit when safe", async () => {
    (getProjectById as jest.Mock).mockResolvedValue(project(tenantAId));
    (countTasksByProject as jest.Mock).mockResolvedValue(0);
    (countBugsByProject as jest.Mock).mockResolvedValue(0);
    (deleteCommentsByEntity as jest.Mock).mockResolvedValue({ deletedCount: 3 });
    (deleteProjectById as jest.Mock).mockResolvedValue(project(tenantAId));

    const result = await deleteProjectService(projectId, tenantAId, superAdminId);

    expect(result).toEqual({
      id: projectId,
      name: "Platform",
      status: "ACTIVE",
      deletedComments: 3,
    });
    expect(deleteCommentsByEntity).toHaveBeenCalledWith(
      tenantAId,
      "PROJECT",
      projectId,
    );
    expect(deleteProjectById).toHaveBeenCalledWith(projectId);
    expect(emitTenantNotification).toHaveBeenCalledWith(
      tenantAId,
      expect.objectContaining({ type: "project.deleted" }),
    );
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: tenantAId,
        actorUserId: superAdminId,
        targetId: projectId,
        details: expect.objectContaining({ deletedComments: 3 }),
      }),
    );
  });
});
