import mongoose, { UpdateQuery } from "mongoose";

import { EmailLog, IEmailLog } from "./email.model";
import {
  EmailLogListQuery,
  EmailSummaryQuery,
  SendEmailInput,
} from "./email.types";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const createEmailLog = async (
  tenantId: string,
  requestedBy: string,
  data: SendEmailInput,
) => {
  return EmailLog.create({
    ...data,
    tenantId,
    requestedBy,
  });
};

const buildEmailLogFilter = (
  tenantId: string,
  query: EmailLogListQuery | EmailSummaryQuery,
) => {
  const filter: any = { tenantId: toObjectId(tenantId) };

  if (query.requestedBy) {
    filter.requestedBy = toObjectId(query.requestedBy);
  }

  if (query.templateKey) {
    filter.templateKey = query.templateKey;
  }

  if ("status" in query && query.status) {
    filter.status = query.status;
  }

  if (query.fromDate || query.toDate) {
    filter.createdAt = {};

    if (query.fromDate) {
      filter.createdAt.$gte = query.fromDate;
    }

    if (query.toDate) {
      filter.createdAt.$lte = query.toDate;
    }
  }

  if ("search" in query && query.search) {
    filter.$or = [
      { subject: { $regex: query.search, $options: "i" } },
      { to: { $regex: query.search, $options: "i" } },
      { cc: { $regex: query.search, $options: "i" } },
      { bcc: { $regex: query.search, $options: "i" } },
      { templateKey: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getEmailLogs = async (tenantId: string, query: EmailLogListQuery) => {
  const filter = buildEmailLogFilter(tenantId, query);

  const [emailLogs, total] = await Promise.all([
    EmailLog.find(filter)
      .select("tenantId requestedBy to cc bcc subject templateKey status sentAt failedAt error createdAt updatedAt")
      .populate("requestedBy", "name email role profileImage")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    EmailLog.countDocuments(filter),
  ]);

  return { emailLogs, total };
};

const getEmailLogById = async (emailLogId: string, tenantId: string) => {
  return EmailLog.findOne({
    _id: emailLogId,
    tenantId,
  })
    .select("-__v")
    .populate("requestedBy", "name email role profileImage");
};

const updateEmailLog = async (
  emailLogId: string,
  tenantId: string,
  update: UpdateQuery<IEmailLog>,
) => {
  return EmailLog.findOneAndUpdate(
    {
      _id: emailLogId,
      tenantId,
    },
    update,
    {
      new: true,
      runValidators: true,
    },
  )
    .select("-__v")
    .populate("requestedBy", "name email role profileImage");
};

const getEmailSummary = async (
  tenantId: string,
  query: EmailSummaryQuery,
) => {
  const filter = buildEmailLogFilter(tenantId, query);

  const [summary] = await EmailLog.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalEmails: { $sum: 1 },
        queuedEmails: {
          $sum: { $cond: [{ $eq: ["$status", "queued"] }, 1, 0] },
        },
        sentEmails: {
          $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
        },
        failedEmails: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        firstEmailAt: { $min: "$createdAt" },
        lastEmailAt: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 0,
        totalEmails: 1,
        queuedEmails: 1,
        sentEmails: 1,
        failedEmails: 1,
        firstEmailAt: 1,
        lastEmailAt: 1,
      },
    },
  ]);

  return (
    summary || {
      totalEmails: 0,
      queuedEmails: 0,
      sentEmails: 0,
      failedEmails: 0,
      firstEmailAt: null,
      lastEmailAt: null,
    }
  );
};

export {
  createEmailLog,
  getEmailLogs,
  getEmailLogById,
  updateEmailLog,
  getEmailSummary,
};
