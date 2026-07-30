import type { CorsOptions } from "cors";
import type { NextFunction, Request, Response } from "express";

const DEFAULT_BODY_LIMIT = "1mb";
const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
type CorsOriginCallback = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) => void;

class CorsError extends Error {
  statusCode = 403;
  code = "CORS_ORIGIN_DENIED";

  constructor(origin?: string) {
    super(
      process.env.NODE_ENV === "production"
        ? "Origin not allowed by CORS"
        : `Origin not allowed by CORS: ${origin}`,
    );

    this.name = "CorsError";
  }
}

const getRequestBodyLimit = () =>
  process.env.REQUEST_BODY_LIMIT || DEFAULT_BODY_LIMIT;

const normalizeOrigin = (value: string): string => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return "";
  }
};

const getAllowedCorsOrigins = (): Set<string> => {
  const configuredOrigins = [
    ...(process.env.CLIENT_URL || "").split(","),
    process.env.API_BASE_URL || "",
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  return new Set(configuredOrigins);
};

const isLocalDevelopmentOrigin = (origin: string): boolean => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const url = new URL(origin);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOCAL_DEV_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
};

const corsOrigin: CorsOriginCallback = (origin, callback) => {
  /*
   * Allow requests without an Origin header.
   *
   * Examples:
   * - Postman
   * - curl
   * - server-to-server requests
   * - health checks
   */
  if (!origin) {
    callback(null, true);
    return;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = getAllowedCorsOrigins();

  if (
    normalizedOrigin &&
    (allowedOrigins.has(normalizedOrigin) ||
      isLocalDevelopmentOrigin(normalizedOrigin))
  ) {
    callback(null, true);
    return;
  }

  console.warn("CORS request blocked", {
    origin: normalizedOrigin || origin,
  });

  callback(new CorsError(normalizedOrigin || origin));
};

const corsOptions: CorsOptions = {
  origin: corsOrigin,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],

  exposedHeaders: ["Content-Disposition"],

  /*
   * Tokens are sent using:
   * Authorization: Bearer <access-token>
   *
   * Cookies are not being used in the current Tenantrix version.
   */
  credentials: false,

  optionsSuccessStatus: 204,

  maxAge: 86400,
};

const hasUnsafeMongoKey = (key: string): boolean =>
  key.startsWith("$") || key.includes(".");

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

const mongoSanitize = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.body = sanitizeMongoValue(req.body);

  Object.defineProperty(req, "query", {
    value: sanitizeMongoValue(req.query),
    writable: true,
    configurable: true,
  });

  Object.defineProperty(req, "params", {
    value: sanitizeMongoValue(req.params),
    writable: true,
    configurable: true,
  });

  next();
};

export {
  CorsError,
  corsOptions,
  corsOrigin,
  getRequestBodyLimit,
  mongoSanitize,
};
