import { NextFunction, Request, Response } from "express";

const DEFAULT_BODY_LIMIT = "1mb";
const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const getRequestBodyLimit = () => process.env.REQUEST_BODY_LIMIT || DEFAULT_BODY_LIMIT;

const getAllowedCorsOrigins = () => {
  const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return new Set(configuredOrigins);
  }

  return new Set<string>();
};

const isLocalDevOrigin = (origin: string) => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const url = new URL(origin);

    return ["http:", "https:"].includes(url.protocol) && LOCAL_DEV_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (getAllowedCorsOrigins().has(origin) || isLocalDevOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

const hasUnsafeMongoKey = (key: string) => key.startsWith("$") || key.includes(".");

const sanitizeMongoValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeMongoValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce(
    (safeValue, [key, nestedValue]) => {
      if (!hasUnsafeMongoKey(key)) {
        safeValue[key] = sanitizeMongoValue(nestedValue);
      }

      return safeValue;
    },
    {} as Record<string, unknown>,
  );
};

const mongoSanitize = (req: Request, _res: Response, next: NextFunction) => {
  req.body = sanitizeMongoValue(req.body);
  (req as any).query = sanitizeMongoValue(req.query);
  (req as any).params = sanitizeMongoValue(req.params);

  return next();
};

export { corsOptions, getRequestBodyLimit, mongoSanitize };
