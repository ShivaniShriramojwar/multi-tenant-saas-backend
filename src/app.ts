import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import rootRouter from "./common/routes";
import healthRouter from "./common/health";
import { errorHandler } from "./common/middleware/error.middleware";
import { apiLimiter } from "./common/middleware/rate-limit.middleware";
import { requestLogger } from "./common/middleware/request-logger.middleware";
import {
  corsOptions,
  getRequestBodyLimit,
  mongoSanitize,
} from "./common/middleware/security.middleware";
import { postmanCollection, swaggerSpec } from "./docs/swagger";

const app = express();

// 1. Global Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: getRequestBodyLimit() }));
app.use(express.urlencoded({ extended: false, limit: getRequestBodyLimit() }));
app.use(mongoSanitize);
app.use(requestLogger);

// 2. Health check FIRST
app.get("/", (req, res) => {
  res.send("SaaS API Gateway Running cleanly...");
});
app.use(healthRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});
app.get("/api-docs/postman.json", (_req, res) => {
  res.json(postmanCollection);
});

// 3. Routes AFTER
app.use("/api/v1", apiLimiter, rootRouter);

app.use(errorHandler);

export default app;
