import { ConflictError } from "../../common/errors/app-error";
import { AUDIT_ACTION } from "../../common/constants/audit-actions";

import { createAuditLog } from "../audit/audit.service";

import {
  createProject,
  deleteProjectById,
  getProjectById,
  getProjectsByTenant,
  updateProjectById,
} from "./project.repository";
import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { ENTITY_TYPE } from "../../common/constants/entity-type";
import { countBugsByProject } from "../bug/bug.repository";
import { deleteCommentsByEntity } from "../comment/comment.repository";
import { countTasksByProject } from "../task/task.repository";
import {
  assertSameTenant,
  buildPaginationResponse,
  createNotFoundError,
} from "../../common/utils/service.util";
import {
  CreateProjectInput,
  ProjectListQuery,
  UpdateProjectInput,
} from "./project.type";

const createProjectService = async (
  data: CreateProjectInput,
  tenantId: string,
  userId: string,
) => {
  const project = await createProject({
    ...data,
    tenantId,
    createdBy: userId,
  });

  await createAuditLog({
    tenantId,
    actorUserId: userId,
    action: AUDIT_ACTION.PROJECT_CREATED,
    targetType: "project",
    targetId: project._id.toString(),
    details: {
      name: project.name,
      status: project.status,
    },
  });

  emitTenantNotification(tenantId, {
    type: "project.created",
    message: "A new project was created",
    data: {
      projectId: project._id.toString(),
      name: project.name,
      status: project.status,
      createdBy: userId,
    },
  });

  return project;
};

const getProjectsService = async (
  tenantId: string,
  query: ProjectListQuery,
) => {
  const result = await getProjectsByTenant(tenantId, query);

  return buildPaginationResponse(result.projects, query, result.total);
};

const getProjectByIdService = async (projectId: string, tenantId: string) => {
  const project = await getProjectById(projectId);

  return assertSameTenant(project, tenantId, "Project");
};

const updateProjectService = async (
  projectId: string,
  data: UpdateProjectInput,
  tenantId: string,
  actorUserId: string,
) => {
  const project = await updateProjectById(projectId, tenantId, data);

  if (!project) {
    throw createNotFoundError("Project");
  }
  const existingProject = await getProjectById(projectId);
  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.PROJECT_UPDATED,
    targetType: "project",
    targetId: project._id.toString(),
    details: {
      previousProject: {
        name: existingProject?.name,
        status: existingProject?.status,
      },
      updatedProject: {
        name: project.name,
        status: project.status,
      },
    },
  });

  emitTenantNotification(tenantId, {
    type: "project.updated",
    message: "Project updated successfully",
    data: {
      projectId: project._id.toString(),
      name: project.name,
      status: project.status,
    },
  });

  return project;
};

const deleteProjectService = async (
  projectId: string,
  tenantId: string,
  actorUserId: string,
) => {
  const project = assertSameTenant(
    await getProjectById(projectId),
    tenantId,
    "Project",
  );

  const [taskCount, bugCount] = await Promise.all([
    countTasksByProject(projectId, tenantId),
    countBugsByProject(projectId, tenantId),
  ]);

  if (taskCount > 0 || bugCount > 0) {
    const error = new ConflictError(
      "Project cannot be deleted while it has tasks or bugs",
    ) as ConflictError & { details: { tasks: number; bugs: number } };
    error.details = {
      tasks: taskCount,
      bugs: bugCount,
    };
    throw error;
  }

  const deletedComments = await deleteCommentsByEntity(
    tenantId,
    ENTITY_TYPE.PROJECT,
    projectId,
  );

  await deleteProjectById(projectId);

  // Emit socket notification
  emitTenantNotification(tenantId, {
    type: "project.deleted",
    message: "A project was deleted",
    data: {
      projectId: project._id.toString(),
      name: project.name,
      status: project.status,
    },
  });

  // Create audit log
  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.PROJECT_DELETED,
    targetType: "project",
    targetId: project._id.toString(),
    details: {
      name: project.name,
      status: project.status,
      deletedComments: deletedComments.deletedCount,
    },
  });

  return {
    id: project._id.toString(),
    name: project.name,
    status: project.status,
    deletedComments: deletedComments.deletedCount,
  };
};
export {
  createProjectService,
  getProjectsService,
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
};
