import { QueueEvents } from "bullmq";
import { emitTenantNotification } from "../socket/socket";
import { orderQueue } from "./order.queue";
import { connection } from "./redis";

const registerOrderQueueEvents = () => {
  const queueEvents = new QueueEvents("order-queue", { connection });

  queueEvents.on("completed", async ({ jobId }) => {
    const job = await orderQueue.getJob(jobId);

    if (!job) {
      return;
    }

    emitTenantNotification(job.data.tenantId, {
      type: "order.completed",
      message: "Order processing completed",
      data: {
        orderId: job.data.orderId,
        tenantId: job.data.tenantId,
      },
    });
  });

  queueEvents.on("failed", async ({ jobId, failedReason }) => {
    const job = await orderQueue.getJob(jobId);

    if (!job) {
      return;
    }

    emitTenantNotification(job.data.tenantId, {
      type: "order.failed",
      message: "Order processing failed",
      data: {
        orderId: job.data.orderId,
        tenantId: job.data.tenantId,
        reason: failedReason,
      },
    });
  });

  queueEvents.on("error", (error) => {
    console.error("Order queue event listener error:", error.message);
  });

  return queueEvents;
};

export { registerOrderQueueEvents };
