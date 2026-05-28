import { Queue } from "bullmq";
import { connection } from "./redis";

const orderQueue = new Queue("order-queue", {
  connection,
});

export { orderQueue };
