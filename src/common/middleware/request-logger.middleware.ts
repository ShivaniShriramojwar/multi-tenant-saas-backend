import { randomUUID } from "crypto";
import { Request, RequestHandler, Response } from "express";
import pinoHttp from "pino-http";
import { logger } from "../logger";

type RequestWithContext = Request & {
  id?: string;
  user?: {
    userId?: string;
    tenantId?: string;
  };
};

const getRequestId = (req: Request) => {
  const requestId = req.header("x-request-id");

  return requestId || randomUUID();
};

const getRoute = (req: Request) => {
  if (req.route?.path) {
    return `${req.baseUrl}${req.route.path}`;
  }

  return req.originalUrl || req.url;
};

const requestLogger = pinoHttp({
  logger,
  genReqId: (req: RequestWithContext, res: Response) => {
    const requestId = getRequestId(req);
    req.id = requestId;
    res.setHeader("x-request-id", requestId);

    return requestId;
  },
  customProps: (req: RequestWithContext) => ({
    requestId: req.id,
  }),
  customSuccessObject: (req: RequestWithContext, res: Response, val) => ({
    ...val,
    requestId: req.id,
    tenantId: req.user?.tenantId,
    userId: req.user?.userId,
    route: getRoute(req),
    statusCode: res.statusCode,
  }),
  customErrorObject: (req: RequestWithContext, res: Response, error, val) => ({
    ...val,
    err: error,
    requestId: req.id,
    tenantId: req.user?.tenantId,
    userId: req.user?.userId,
    route: getRoute(req),
    statusCode: res.statusCode,
  }),
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        route: getRoute(req),
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
}) as unknown as RequestHandler;

export { requestLogger };
