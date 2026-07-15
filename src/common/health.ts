import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { Router } from "express";
import Redis from "ioredis";
import mongoose from "mongoose";
import { connection } from "../infrastructure/queue/redis";
import { getS3Config, s3Client } from "../infrastructure/storage/s3";
import { logger } from "./logger";

type DependencyStatus = {
  status: "up" | "down";
  details?: string;
};

const router = Router();
const READINESS_TIMEOUT_MS = Number(process.env.READINESS_TIMEOUT_MS || 3000);

const withTimeout = async <T>(operation: Promise<T>, label: string) => {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${label} readiness check timed out`)),
      READINESS_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

const checkMongo = async (): Promise<DependencyStatus> => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return {
      status: "down",
      details: "MongoDB connection is not ready",
    };
  }

  try {
    await withTimeout(mongoose.connection.db.admin().ping(), "MongoDB");

    return { status: "up" };
  } catch (error) {
    logger.error({ err: error }, "MongoDB readiness check failed");

    return {
      status: "down",
      details: getErrorMessage(error),
    };
  }
};

const checkRedis = async (): Promise<DependencyStatus> => {
  const redis = new Redis({
    ...connection,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  redis.on("error", () => undefined);

  try {
    await withTimeout(redis.connect(), "Redis connect");
    await withTimeout(redis.ping(), "Redis ping");

    return { status: "up" };
  } catch (error) {
    logger.error({ err: error }, "Redis readiness check failed");

    return {
      status: "down",
      details: getErrorMessage(error),
    };
  } finally {
    redis.disconnect();
  }
};

const checkS3 = async (): Promise<DependencyStatus> => {
  try {
    const { bucket } = getS3Config();

    await withTimeout(
      s3Client.send(new HeadBucketCommand({ Bucket: bucket })),
      "S3",
    );

    return { status: "up" };
  } catch (error) {
    logger.error({ err: error }, "S3 readiness check failed");

    return {
      status: "down",
      details: getErrorMessage(error),
    };
  }
};

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
  });
});

router.get("/ready", async (_req, res) => {
  const [mongo, redis, s3] = await Promise.all([
    checkMongo(),
    checkRedis(),
    checkS3(),
  ]);
  const checks = { mongo, redis, s3 };
  const isReady = Object.values(checks).every((check) => check.status === "up");

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "not_ready",
    checks,
  });
});

export default router;
