"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const project_service_1 = require("../../src/modules/project/project.service");
const project_repository_1 = require("../../src/modules/project/project.repository");
const task_repository_1 = require("../../src/modules/task/task.repository");
const bug_repository_1 = require("../../src/modules/bug/bug.repository");
const comment_repository_1 = require("../../src/modules/comment/comment.repository");
const audit_service_1 = require("../../src/modules/audit/audit.service");
const socket_1 = require("../../src/infrastructure/socket/socket");
const auth_fixture_1 = require("../fixtures/auth.fixture");
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
const project = (tenantId = auth_fixture_1.tenantAId) => ({
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
        project_repository_1.getProjectById.mockResolvedValue(project(auth_fixture_1.tenantBId));
        await expect((0, project_service_1.getProjectByIdService)(projectId, auth_fixture_1.tenantAId)).rejects.toMatchObject({
            message: "Project not found",
            statusCode: 404,
        });
    });
    it("does not delete a project that still has dependent tasks or bugs", async () => {
        project_repository_1.getProjectById.mockResolvedValue(project(auth_fixture_1.tenantAId));
        task_repository_1.countTasksByProject.mockResolvedValue(2);
        bug_repository_1.countBugsByProject.mockResolvedValue(1);
        await expect((0, project_service_1.deleteProjectService)(projectId, auth_fixture_1.tenantAId, auth_fixture_1.superAdminId)).rejects.toMatchObject({
            message: "Project cannot be deleted while it has tasks or bugs",
            statusCode: 409,
            details: {
                tasks: 2,
                bugs: 1,
            },
        });
        expect(comment_repository_1.deleteCommentsByEntity).not.toHaveBeenCalled();
        expect(project_repository_1.deleteProjectById).not.toHaveBeenCalled();
        expect(audit_service_1.createAuditLog).not.toHaveBeenCalled();
    });
    it("deletes project comments, project record, notification, and audit when safe", async () => {
        project_repository_1.getProjectById.mockResolvedValue(project(auth_fixture_1.tenantAId));
        task_repository_1.countTasksByProject.mockResolvedValue(0);
        bug_repository_1.countBugsByProject.mockResolvedValue(0);
        comment_repository_1.deleteCommentsByEntity.mockResolvedValue({ deletedCount: 3 });
        project_repository_1.deleteProjectById.mockResolvedValue(project(auth_fixture_1.tenantAId));
        const result = await (0, project_service_1.deleteProjectService)(projectId, auth_fixture_1.tenantAId, auth_fixture_1.superAdminId);
        expect(result).toEqual({
            id: projectId,
            name: "Platform",
            status: "ACTIVE",
            deletedComments: 3,
        });
        expect(comment_repository_1.deleteCommentsByEntity).toHaveBeenCalledWith(auth_fixture_1.tenantAId, "PROJECT", projectId);
        expect(project_repository_1.deleteProjectById).toHaveBeenCalledWith(projectId);
        expect(socket_1.emitTenantNotification).toHaveBeenCalledWith(auth_fixture_1.tenantAId, expect.objectContaining({ type: "project.deleted" }));
        expect(audit_service_1.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
            tenantId: auth_fixture_1.tenantAId,
            actorUserId: auth_fixture_1.superAdminId,
            targetId: projectId,
            details: expect.objectContaining({ deletedComments: 3 }),
        }));
    });
});
