import { Comment } from "./comment.model";
import { CommentListQuery } from "./comment.types";
import { EntityType } from "../../common/constants/entity-type";

const createComment = async (data: any) => {
  return Comment.create(data);
};

const buildCommentFilter = (tenantId: string, query: CommentListQuery) => {
  const filter: any = {
    tenantId,
  };

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.entityId) {
    filter.entityId = query.entityId;
  }

  if (query.createdBy) {
    filter.createdBy = query.createdBy;
  }

  if (query.search) {
    filter.content = {
      $regex: query.search,
      $options: "i",
    };
  }

  return filter;
};

const getComments = async (tenantId: string, query: CommentListQuery) => {
  const filter = buildCommentFilter(tenantId, query);

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .select("content entityType entityId tenantId createdBy mentions parentComment createdAt updatedAt")
      .populate("createdBy", "name email profileImage")
      .populate("mentions", "name email")
      .populate("parentComment", "content createdBy")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),

    Comment.countDocuments(filter),
  ]);

  return {
    comments,
    total,
  };
};

const getCommentById = async (commentId: string) => {
  return Comment.findById(commentId)
    .populate("createdBy", "name email profileImage")
    .populate("mentions", "name email")
    .populate("parentComment", "content createdBy");
};

const updateCommentById = async (
  commentId: string,
  tenantId: string,
  data: any,
) => {
  return Comment.findOneAndUpdate(
    {
      _id: commentId,
      tenantId,
    },
    data,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("createdBy", "name email profileImage")
    .populate("mentions", "name email")
    .populate("parentComment", "content createdBy");
};

const deleteCommentById = async (commentId: string) => {
  return Comment.findByIdAndDelete(commentId);
};

const deleteCommentsByEntity = async (
  tenantId: string,
  entityType: EntityType,
  entityId: string,
) => {
  return Comment.deleteMany({
    tenantId,
    entityType,
    entityId,
  });
};

export {
  createComment,
  getComments,
  getCommentById,
  updateCommentById,
  deleteCommentById,
  deleteCommentsByEntity,
};
