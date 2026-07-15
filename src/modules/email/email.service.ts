import mongoose from "mongoose";
import { AppError } from "../../common/errors/app-error";

import { getObjectIdString } from "../../common/utils/object-id.util";
import { getPaginationMeta } from "../../common/utils/pagination.util";
import { enqueueEmailDelivery } from "../../infrastructure/queue/email.queue";
import { getUserById } from "../user/user.repository";

import { EMAIL_STATUS, IEmailLog } from "./email.model";
import {
  createEmailLog,
  getEmailLogById,
  getEmailLogs,
  getEmailSummary,
  updateEmailLog,
} from "./email.repository";
import {
  EmailLogListQuery,
  EmailSummaryQuery,
  SendEmailInput,
} from "./email.types";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const assertValidObjectId = (id: string, label: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(`Invalid ${label}`, 400);
  }
};

const validateTenantUser = async (userId: string, tenantId: string) => {
  assertValidObjectId(userId, "user ID");

  const user = await getUserById(userId);

  if (!user || getObjectIdString(user.tenantId) !== tenantId) {
    throw createHttpError("User not found", 404);
  }
};

const validateQueryUser = async (
  query: EmailLogListQuery | EmailSummaryQuery,
  tenantId: string,
) => {
  if (query.requestedBy) {
    await validateTenantUser(query.requestedBy, tenantId);
  }
};

const sendWithConfiguredProvider = async (emailLog: IEmailLog) => {
  if (process.env.EMAIL_DELIVERY_MODE === "fail") {
    throw new Error("Email provider is configured to fail");
  }

  return {
    providerMessageId:
      process.env.EMAIL_DELIVERY_MODE === "log"
        ? `log_${emailLog._id.toString()}`
        : `local_${Date.now()}_${emailLog._id.toString()}`,
  };
};

const deliverEmailLog = async (emailLog: IEmailLog, tenantId: string) => {
  try {
    const result = await sendWithConfiguredProvider(emailLog);

    return updateEmailLog(emailLog._id.toString(), tenantId, {
      $set: {
        status: EMAIL_STATUS.SENT,
        providerMessageId: result.providerMessageId,
        sentAt: new Date(),
      },
      $unset: {
        errorMessage: "",
      },
    });
  } catch (error) {
    return updateEmailLog(emailLog._id.toString(), tenantId, {
      $set: {
        status: EMAIL_STATUS.FAILED,
        errorMessage: error instanceof Error ? error.message : "Email delivery failed",
      },
    });
  }
};

const queueEmailLogDelivery = async (emailLog: IEmailLog, tenantId: string) => {
  try {
    await enqueueEmailDelivery({
      emailLogId: emailLog._id.toString(),
      tenantId,
    });
  } catch (error) {
    await deliverEmailLog(emailLog, tenantId);
  }
};

const sendEmailService = async (
  data: SendEmailInput,
  tenantId: string,
  requestedBy: string,
) => {
  await validateTenantUser(requestedBy, tenantId);

  const emailLog = await createEmailLog(tenantId, requestedBy, data);

  await queueEmailLogDelivery(emailLog, tenantId);

  return emailLog;
};

const getEmailLogsService = async (
  tenantId: string,
  query: EmailLogListQuery,
) => {
  await validateQueryUser(query, tenantId);

  const result = await getEmailLogs(tenantId, query);

  return {
    data: result.emailLogs,
    pagination: getPaginationMeta(query.page, query.limit, result.total),
  };
};

const getEmailLogByIdService = async (
  emailLogId: string,
  tenantId: string,
) => {
  assertValidObjectId(emailLogId, "email log ID");

  const emailLog = await getEmailLogById(emailLogId, tenantId);

  if (!emailLog) {
    throw createHttpError("Email log not found", 404);
  }

  return emailLog;
};

const retryEmailService = async (emailLogId: string, tenantId: string) => {
  const emailLog = await getEmailLogByIdService(emailLogId, tenantId);

  if (emailLog.status === EMAIL_STATUS.SENT) {
    throw createHttpError("Email has already been sent", 409);
  }

  await updateEmailLog(emailLog._id.toString(), tenantId, {
    $set: {
      status: EMAIL_STATUS.QUEUED,
    },
    $unset: {
      errorMessage: "",
    },
  });

  await queueEmailLogDelivery(emailLog, tenantId);

  return getEmailLogByIdService(emailLogId, tenantId);
};

const getEmailSummaryService = async (
  tenantId: string,
  query: EmailSummaryQuery,
) => {
  await validateQueryUser(query, tenantId);

  return getEmailSummary(tenantId, query);
};

export {
  sendEmailService,
  getEmailLogsService,
  getEmailLogByIdService,
  retryEmailService,
  getEmailSummaryService,
  deliverEmailLog,
};
