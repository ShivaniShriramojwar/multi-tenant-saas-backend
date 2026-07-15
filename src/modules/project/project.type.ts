interface CreateProjectInput {
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
}

interface ProjectListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}
export { CreateProjectInput, ProjectListQuery, UpdateProjectInput };
