import { Queue } from "bullmq";
import { connection } from "./redis";

export interface EmailDeliveryJob {
  emailLogId: string;
  tenantId: string;
}

const emailQueue = new Queue<EmailDeliveryJob>("email-queue", {
  connection,
});

const enqueueEmailDelivery = async (data: EmailDeliveryJob) => {
  return emailQueue.add("deliver-email", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  });
};

export { emailQueue, enqueueEmailDelivery };
