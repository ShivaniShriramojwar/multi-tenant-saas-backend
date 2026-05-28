import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import rootRouter from "./common/routes";
import { errorHandler } from "./common/middleware/error.middleware";
import { apiLimiter } from "./common/middleware/rate-limit.middleware";
import { swaggerSpec } from "./docs/swagger";

const app = express();

// 1. Global Middlewares
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// 2. Health check FIRST
app.get("/", (req, res) => {
  res.send("SaaS API Gateway Running cleanly...");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// 3. Routes AFTER
app.use("/api/v1", apiLimiter, rootRouter);

app.use(errorHandler);

export default app;
