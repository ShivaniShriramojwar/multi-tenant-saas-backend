import { Bug } from "./bug.model";

import { Severity } from "../../common/constants/severity";
import { BugStatus } from "../../common/constants/bug-status";

interface BugListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: BugStatus;
  severity?: Severity;
  projectId?: string;
  taskId?: string;
  assignedTo?: string;
  reportedBy?: string;
}

const createBug = async (data: any) => {
  return Bug.create(data);
};

const buildBugFilter = (tenantId: string, query: BugListQuery) => {
  const filter: any = {
    tenantId,
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.severity) {
    filter.severity = query.severity;
  }

  if (query.projectId) {
    filter.projectId = query.projectId;
  }

  if (query.taskId) {
    filter.taskId = query.taskId;
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.reportedBy) {
    filter.reportedBy = query.reportedBy;
  }

  if (query.search) {
    filter.$or = [
      {
        title: {
          $regex: query.search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query.search,
          $options: "i",
        },
      },
    ];
  }

  return filter;
};

const getBugsByTenant = async (tenantId: string, query: BugListQuery) => {
  const filter = buildBugFilter(tenantId, query);

  const [bugs, total] = await Promise.all([
    Bug.find(filter)
      .select("title description projectId taskId tenantId reportedBy assignedTo severity status createdAt updatedAt")
      .populate("projectId", "name")
      .populate("taskId", "title")
      .populate("reportedBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),

    Bug.countDocuments(filter),
  ]);

  return {
    bugs,
    total,
  };
};

const getBugById = async (bugId: string) => {
  return Bug.findById(bugId)
    .populate("projectId", "name")
    .populate("taskId", "title")
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");
};

const updateBugById = async (bugId: string, tenantId: string, data: any) => {
  return Bug.findOneAndUpdate(
    {
      _id: bugId,
      tenantId,
    },
    data,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("taskId", "title")
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");
};

const deleteBugById = async (bugId: string) => {
  return Bug.findByIdAndDelete(bugId);
};

const countBugsByProject = async (projectId: string, tenantId: string) => {
  return Bug.countDocuments({
    projectId,
    tenantId,
  });
};

const assignBugToUser = async (
  bugId: string,
  tenantId: string,
  assignedTo: string,
) => {
  return Bug.findOneAndUpdate(
    {
      _id: bugId,
      tenantId,
    },
    {
      assignedTo,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("taskId", "title")
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");
};

const updateBugStatus = async (
  bugId: string,
  tenantId: string,
  status: BugStatus,
) => {
  return Bug.findOneAndUpdate(
    {
      _id: bugId,
      tenantId,
    },
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("taskId", "title")
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");
};

const updateBugSeverity = async (
  bugId: string,
  tenantId: string,
  severity: Severity,
) => {
  return Bug.findOneAndUpdate(
    {
      _id: bugId,
      tenantId,
    },
    {
      severity,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("taskId", "title")
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");
};

export {
  createBug,
  getBugsByTenant,
  getBugById,
  updateBugById,
  deleteBugById,
  countBugsByProject,
  assignBugToUser,
  updateBugStatus,
  updateBugSeverity,
};
