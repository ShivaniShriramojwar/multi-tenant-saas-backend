import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { connectDB } from "./infrastructure/db/mongo";
import { registerOrderQueueEvents } from "./infrastructure/queue/order.events";
import { initSocket } from "./infrastructure/socket/socket";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  registerOrderQueueEvents();

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log("WebSocket server ready");
  });
};

startServer();
