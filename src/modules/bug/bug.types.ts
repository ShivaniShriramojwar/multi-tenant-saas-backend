import { BugStatus } from "../../common/constants/bug-status";
import { Severity } from "../../common/constants/severity";

export enum BugSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
interface CreateBugInput {
  title: string;
  description: string;
  projectId: string;
  taskId?: string;
  assignedTo?: string;
  severity?: Severity;
  status?: BugStatus;
}

interface UpdateBugInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  severity?: Severity;
  status?: BugStatus;
}

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
export { CreateBugInput, UpdateBugInput, BugListQuery };
