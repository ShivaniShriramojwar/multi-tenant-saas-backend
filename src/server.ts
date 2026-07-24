import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { connectDB } from "./infrastructure/db/mongo";
import { registerOrderQueueEvents } from "./infrastructure/queue/order.events";
import { initSocket } from "./infrastructure/socket/socket";
import { logger } from "./common/logger";

const PORT = Number(process.env.PORT) || 5001;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  registerOrderQueueEvents();

  server.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT }, "Server running");
    logger.info("WebSocket server ready");
  });
};

startServer().catch((error) => {
  logger.fatal({ err: error }, "Server startup failed");
  process.exit(1);
});
