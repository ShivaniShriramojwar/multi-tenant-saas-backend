import { ActivityVisibility } from "./activity.model";

export interface ActivityChangeInput {
  field: string;
  from?: unknown;
  to?: unknown;
}

export interface CreateActivityInput {
  actorUserId?: string;
  action: string;
  targetType: string;
  targetId: string;
  projectId?: string;
  summary: string;
  changes?: ActivityChangeInput[];
  metadata?: Record<string, unknown>;
  visibility?: ActivityVisibility;
  occurredAt?: Date;
}

export interface ActivityListQuery {
  page: number;
  limit: number;
  skip: number;
  actorUserId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  entityType?: string;
  entityId?: string;
  projectId?: string;
  visibility?: ActivityVisibility;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface ActivityTimelineQuery {
  page: number;
  limit: number;
  skip: number;
  entityType: string;
  entityId: string;
}

export interface ActivityTimelineItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  occurredAt: Date;
  actor?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    profileImage?: unknown;
  };
  details?: Record<string, unknown>;
}
