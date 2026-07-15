import dotenv from "dotenv";
dotenv.config();
import { Worker, Job } from "bullmq";
import { logger } from "../../common/logger";
import { connection } from "./redis";
import { updateOrderStatus } from "../../modules/order/order.repository";

import { connectDB } from "../db/mongo";

const startWorker = async () => {
  try {
    await connectDB();
    logger.info("Order worker MongoDB connected");

    logger.info("Order worker started");

    const worker = new Worker(
      "order-queue",
      async (job: Job) => {
        const { orderId } = job.data;

        logger.info(
          { jobId: job.id, orderId, tenantId: job.data.tenantId },
          "Processing order job",
        );

        try {
          await updateOrderStatus(orderId, "processing");

          const attempt = job.attemptsMade + 1;
          logger.info({ jobId: job.id, orderId, attempt }, "Order job attempt");

          if (attempt < 3) {
            throw new Error("Temporary failure");
          }

          await updateOrderStatus(orderId, "completed");

          logger.info({ jobId: job.id, orderId }, "Order completed");

          return true;
        } catch (error: any) {
          logger.error({ err: error, jobId: job.id, orderId }, "Order job attempt failed");
          throw error;
        }
      },
      {
        connection,
        concurrency: 5,
      },
    );

    worker.on("completed", (job) => {
      logger.info(
        { jobId: job.id, orderId: job.data.orderId, tenantId: job.data.tenantId },
        "Order job completed",
      );
    });

    worker.on("failed", async (job, err) => {
      logger.error(
        {
          err,
          jobId: job?.id,
          attemptsMade: job?.attemptsMade,
          attempts: job?.opts.attempts,
          orderId: job?.data.orderId,
          tenantId: job?.data.tenantId,
        },
        "Order job failed",
      );

      if (job && job.attemptsMade === job.opts.attempts) {
        logger.error(
          { jobId: job.id, orderId: job.data.orderId, tenantId: job.data.tenantId },
          "Order job exhausted retries; marking failed",
        );

        await updateOrderStatus(job.data.orderId, "failed");
      }
    });

    worker.on("ready", () => {
      logger.info("Order worker connected to Redis");
    });

    worker.on("error", (err) => {
      logger.error({ err }, "Order worker error");
    });
  } catch (error) {
    logger.fatal({ err: error }, "Order worker startup failed");
  }
};

startWorker();
