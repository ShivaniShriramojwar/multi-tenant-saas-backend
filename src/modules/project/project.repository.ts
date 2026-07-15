import { Project } from "./project.model";
import { getObjectIdString } from "../../common/utils/object-id.util";

interface ProjectListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
}

/**
 * Create Project
 */
const createProject = async (data: any) => {
  return Project.create(data);
};

/**
 * Build Project Filter
 */
const buildProjectFilter = (tenantId: string, query: ProjectListQuery) => {
  const filter: any = { tenantId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      {
        name: {
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

/**
 * Get Projects By Tenant
 */
const getProjectsByTenant = async (
  tenantId: string,
  query: ProjectListQuery,
) => {
  const filter = buildProjectFilter(tenantId, query);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .select("name description tenantId createdBy status startDate endDate createdAt updatedAt")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),

    Project.countDocuments(filter),
  ]);

  return {
    projects,
    total,
  };
};

/**
 * Get Project By Id
 */

const getProjectById = async (projectId: string) => {
  return Project.findById(projectId)
    .populate("createdBy", "name email")
    .populate("tenantId", "name");
};

const getProjectByIdAndTenant = async (projectId: string, tenantId: string) => {
  const project = await Project.findById(projectId);

  if (!project || getObjectIdString(project.tenantId) !== tenantId) {
    return null;
  }

  return project;
};

const getProjectDetailsById = async (projectId: string) => {
  return Project.findById(projectId)
    .populate("createdBy", "name email")
    .populate("tenantId", "name");
};
/**
 * update Project By Id
 */
const updateProjectById = async (
  projectId: string,
  tenantId: string,
  data: any,
) => {
  return Project.findOneAndUpdate(
    {
      _id: projectId,
      tenantId,
    },
    data,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("createdBy", "name email")
    .populate("tenantId", "name");
};

// delet project by id
const deleteProjectById = async (projectId: string) => {
  return Project.findByIdAndDelete(projectId);
};
export {
  createProject,
  getProjectsByTenant,
  getProjectById,
  getProjectByIdAndTenant,
  updateProjectById,
  deleteProjectById,
};
