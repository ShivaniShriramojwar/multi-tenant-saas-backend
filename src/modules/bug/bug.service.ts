import { BadRequestError, NotFoundError } from "../../common/errors/app-error";
import { AUDIT_ACTION } from "../../common/constants/audit-actions";
import { Severity } from "../../common/constants/severity";
import { BugListQuery, CreateBugInput, UpdateBugInput } from "./bug.types";

import { emitTenantNotification } from "../../infrastructure/socket/socket";

import { createAuditLog } from "../audit/audit.service";

import { getProjectByIdAndTenant } from "../project/project.repository";

import {
  createBug,
  getBugsByTenant,
  getBugById,
  updateBugById,
  deleteBugById,
  assignBugToUser,
  updateBugStatus,
  updateBugSeverity,
} from "./bug.repository";
import { getTaskById } from "../task/task.repository";
import { AUDIT_TARGET } from "../../common/constants/audit-targets";
import { BugStatus } from "../../common/constants/bug-status";
import {
  assertSameTenant,
  buildPaginationResponse,
  createNotFoundError,
} from "../../common/utils/service.util";
import { validateUserBelongsToTenant } from "../user/user-tenant.util";

const createBugService = async (
  data: CreateBugInput,
  tenantId: string,
  actorUserId: string,
) => {
  // Validate Project
  const project = await getProjectByIdAndTenant(data.projectId, tenantId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Validate Task (optional)
  if (data.taskId) {
    const task = assertSameTenant(
      await getTaskById(data.taskId),
      tenantId,
      "Task",
    );
    if (task.projectId.toString() !== data.projectId) {
      throw new BadRequestError("Task does not belong to the selected project");
    }
  }

  // Validate Assigned User (optional)
  if (data.assignedTo) {
    await validateUserBelongsToTenant(data.assignedTo, tenantId, "Assigned user");
  }

  const bug = await createBug({
    ...data,
    tenantId,
    reportedBy: actorUserId,
  });

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.BUG_CREATED,
    targetType: AUDIT_TARGET.BUG,
    targetId: bug._id.toString(),
    details: {
      title: bug.title,
      severity: bug.severity,
      status: bug.status,
    },
  });

  emitTenantNotification(tenantId, {
    type: "bug.created",
    message: "A new bug was created",
    data: {
      bugId: bug._id.toString(),
      title: bug.title,
      severity: bug.severity,
      status: bug.status,
    },
  });

  return bug;
};
const getBugsService = async (tenantId: string, query: BugListQuery) => {
  const result = await getBugsByTenant(tenantId, query);

  return buildPaginationResponse(result.bugs, query, result.total);
};

const getBugByIdService = async (bugId: string, tenantId: string) => {
  const bug = await getBugById(bugId);

  return assertSameTenant(bug, tenantId, "Bug");
};

const updateBugService = async (
  bugId: string,
  data: UpdateBugInput,
  tenantId: string,
  actorUserId: string,
) => {
  const existingBug = assertSameTenant(
    await getBugById(bugId),
    tenantId,
    "Bug",
  );

  const bug = await updateBugById(bugId, tenantId, data);

  if (!bug) {
    throw createNotFoundError("Bug");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.BUG_DELETED,
    targetType: AUDIT_TARGET.BUG,
    targetId: bug._id.toString(),
    details: {
      previousBug: {
        title: existingBug.title,
        status: existingBug.status,
        severity: existingBug.severity,
      },
      updatedBug: {
        title: bug.title,
        status: bug.status,
        severity: bug.severity,
      },
    },
  });

  emitTenantNotification(tenantId, {
    type: "bug.updated",
    message: "Bug updated successfully",
    data: {
      bugId: bug._id.toString(),
      title: bug.title,
      status: bug.status,
    },
  });

  return bug;
};

const deleteBugService = async (
  bugId: string,
  tenantId: string,
  actorUserId: string,
) => {
  const bug = assertSameTenant(await getBugById(bugId), tenantId, "Bug");

  // Delete bug
  await deleteBugById(bugId);

  // Emit socket notification
  emitTenantNotification(tenantId, {
    type: "bug.deleted",
    message: "A bug was deleted",
    data: {
      bugId: bug._id.toString(),
      title: bug.title,
      status: bug.status,
    },
  });

  // Create audit log
  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.BUG_DELETED,
    targetType: AUDIT_TARGET.BUG,
    targetId: bug._id.toString(),
    details: {
      title: bug.title,
      status: bug.status,
      severity: bug.severity,
      projectId: bug.projectId.toString(),
    },
  });

  return {
    id: bug._id.toString(),
    title: bug.title,
    status: bug.status,
  };
};

const assignBugService = async (
  bugId: string,
  assignedTo: string,
  tenantId: string,
  actorUserId: string,
) => {
  const existingBug = assertSameTenant(
    await getBugById(bugId),
    tenantId,
    "Bug",
  );

  await validateUserBelongsToTenant(assignedTo, tenantId, "Assigned user");

  const bug = await assignBugToUser(bugId, tenantId, assignedTo);

  if (!bug) {
    throw createNotFoundError("Bug");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.BUG_ASSIGNED,
    targetType: AUDIT_TARGET.BUG,
    targetId: bug._id.toString(),
    details: {
      previousAssignee: existingBug.assignedTo?.toString() ?? null,
      newAssignee: assignedTo,
    },
  });

  emitTenantNotification(tenantId, {
    type: "bug.assigned",
    message: "Bug assigned successfully",
    data: {
      bugId: bug._id.toString(),
      assignedTo,
    },
  });

  return bug;
};

const updateBugStatusService = async (
  bugId: string,
  status: BugStatus,
  tenantId: string,
  actorUserId: string,
) => {
  const existingBug = assertSameTenant(
    await getBugById(bugId),
    tenantId,
    "Bug",
  );

  const bug = await updateBugStatus(bugId, tenantId, status);

  if (!bug) {
    throw createNotFoundError("Bug");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.BUG_STATUS_CHANGED,
    targetType: AUDIT_TARGET.BUG,
    targetId: bug._id.toString(),
    details: {
      previousStatus: existingBug.status,
      newStatus: bug.status,
    },
  });

  emitTenantNotification(tenantId, {
    type: "bug.status_changed",
    message: "Bug status updated successfully",
    data: {
      bugId: bug._id.toString(),
      status: bug.status,
    },
  });

  return bug;
};

const updateBugSeverityService = async (
  bugId: string,
  severity: Severity,
  tenantId: string,
  actorUserId: string,
) => {
  const existingBug = assertSameTenant(
    await getBugById(bugId),
    tenantId,
    "Bug",
  );

  const bug = await updateBugSeverity(bugId, tenantId, severity);

  if (!bug) {
    throw createNotFoundError("Bug");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.BUG_UPDATED,
    targetType: AUDIT_TARGET.BUG,
    targetId: bug._id.toString(),
    details: {
      previousSeverity: existingBug.severity,
      newSeverity: bug.severity,
    },
  });

  emitTenantNotification(tenantId, {
    type: "bug.updated",
    message: "Bug severity updated successfully",
    data: {
      bugId: bug._id.toString(),
      severity: bug.severity,
    },
  });

  return bug;
};
export {
  createBugService,
  getBugsService,
  getBugByIdService,
  updateBugService,
  deleteBugService,
  assignBugService,
  updateBugStatusService,
  updateBugSeverityService,
};
