import { EntityType } from "../../common/constants/entity-type";

export interface CreateCommentInput {
  content: string;
  entityType: EntityType;
  entityId: string;
  parentComment?: string;
  mentions?: string[];
}

export interface UpdateCommentInput {
  content?: string;
  mentions?: string[];
}

export interface CommentListQuery {
  page: number;
  limit: number;
  skip: number;
  entityType?: EntityType;
  entityId?: string;
  createdBy?: string;
  search?: string;
}
