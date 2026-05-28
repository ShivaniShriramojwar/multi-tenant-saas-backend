import dotenv from "dotenv";
dotenv.config();
import { Worker, Job } from "bullmq";
import { connection } from "./redis";
import { updateOrderStatus } from "../../modules/order/order.repository";

import { connectDB } from "../db/mongo";

const startWorker = async () => {
  try {
    // 🔥 Connect DB
    await connectDB();
    console.log("✅ Worker MongoDB connected");

    console.log("🚀 Worker started...");

    const worker = new Worker(
      "order-queue",
      async (job: Job) => {
        const { orderId } = job.data;

        console.log("📦 Processing order:", orderId);

        try {
          // 🔥 STEP 1: processing
          await updateOrderStatus(orderId, "processing");

          const attempt = job.attemptsMade + 1;
          console.log(`🔁 Attempt: ${attempt}`);

          // 🔥 simulate failure
          if (attempt < 3) {
            throw new Error("Temporary failure");
          }

          // 🔥 STEP 2: completed
          await updateOrderStatus(orderId, "completed");

          console.log("✅ Order completed:", orderId);

          return true;
        } catch (error: any) {
          console.log("⚠️ Error:", error.message);
          throw error; // retry
        }
      },
      {
        connection,
        concurrency: 5,
      },
    );

    // 🔥 EVENTS
    worker.on("completed", (job) => {
      console.log(`🎉 Job completed: ${job.id}`);
    });

    worker.on("failed", async (job, err) => {
      console.log(`❌ Job failed: ${job?.id}`);
      console.log("Attempts:", job?.attemptsMade);

      if (job && job.attemptsMade === job.opts.attempts) {
        console.log("🚨 Final failure → marking FAILED");

        await updateOrderStatus(job.data.orderId, "failed");
      }
    });

    worker.on("ready", () => {
      console.log("✅ Worker connected to Redis");
    });

    worker.on("error", (err) => {
      console.error("🔥 Worker error:", err);
    });
  } catch (error) {
    console.error("❌ Worker startup failed:", error);
  }
};

startWorker();
