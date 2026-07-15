import dotenv from "dotenv";
dotenv.config();

import { Job, Worker } from "bullmq";

import { logger } from "../../common/logger";
import { connectDB } from "../db/mongo";
import { connection } from "./redis";
import { EmailDeliveryJob } from "./email.queue";
import {
  deliverEmailLog,
  getEmailLogByIdService,
} from "../../modules/email/email.service";
import { EMAIL_STATUS } from "../../modules/email/email.model";

const startEmailWorker = async () => {
  try {
    await connectDB();
    logger.info("Email worker MongoDB connected");

    const worker = new Worker<EmailDeliveryJob>(
      "email-queue",
      async (job: Job<EmailDeliveryJob>) => {
        const { emailLogId, tenantId } = job.data;
        const emailLog = await getEmailLogByIdService(emailLogId, tenantId);

        if (emailLog.status === EMAIL_STATUS.SENT) {
          return true;
        }

        await deliverEmailLog(emailLog, tenantId);
        return true;
      },
      {
        connection,
        concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY || 5),
      },
    );

    worker.on("completed", (job) => {
      logger.info(
        { jobId: job.id, tenantId: job.data.tenantId, emailLogId: job.data.emailLogId },
        "Email job completed",
      );
    });

    worker.on("failed", (job, error) => {
      logger.error(
        {
          err: error,
          jobId: job?.id,
          attemptsMade: job?.attemptsMade,
          tenantId: job?.data.tenantId,
          emailLogId: job?.data.emailLogId,
        },
        "Email job failed",
      );
    });

    worker.on("ready", () => {
      logger.info("Email worker connected to Redis");
    });

    worker.on("error", (error) => {
      logger.error({ err: error }, "Email worker error");
    });
  } catch (error) {
    logger.fatal({ err: error }, "Email worker startup failed");
    process.exit(1);
  }
};

startEmailWorker();
