import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { AuthTokenPayload } from "../../common/interfaces/auth.interface";
import { logger } from "../../common/logger";
import { verifyJwtToken } from "../../common/utils/jwt.util";

interface AuthenticatedSocket extends Socket {
  user?: AuthTokenPayload;
}

interface NotificationPayload {
  type: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt?: string;
}

let io: Server | null = null;

const tenantRoom = (tenantId: string) => `tenant:${tenantId}`;
const userRoom = (userId: string) => `user:${userId}`;

const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      socket.user = verifyJwtToken(token);
      return next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user!;

    socket.join(tenantRoom(user.tenantId));
    socket.join(userRoom(user.userId));

    socket.emit("notification", {
      type: "socket.connected",
      message: "Connected to real-time notifications",
      data: {
        userId: user.userId,
        tenantId: user.tenantId,
        role: user.role,
      },
      createdAt: new Date().toISOString(),
    });

    socket.on("disconnect", () => {
      logger.info(
        { socketId: socket.id, userId: user.userId, tenantId: user.tenantId },
        "Socket disconnected",
      );
    });
  });

  return io;
};

const emitTenantNotification = (
  tenantId: string,
  payload: NotificationPayload,
) => {
  if (!io) {
    return;
  }

  io.to(tenantRoom(tenantId)).emit("notification", {
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  });
};

const emitUserNotification = (userId: string, payload: NotificationPayload) => {
  if (!io) {
    return;
  }

  io.to(userRoom(userId)).emit("notification", {
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  });
};

export { initSocket, emitTenantNotification, emitUserNotification };
