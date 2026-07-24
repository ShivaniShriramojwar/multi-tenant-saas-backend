import { NextFunction, Request, Response } from "express";
import { corsOptions, mongoSanitize } from "../../src/common/middleware/security.middleware";

const runMongoSanitize = (req: Partial<Request>) => {
  const next = jest.fn() as NextFunction;

  mongoSanitize(req as Request, {} as Response, next);

  return next;
};

describe("security middleware", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("removes Mongo operator keys from request inputs", () => {
    const req: any = {
      body: {
        email: { $ne: null },
        profile: {
          "role.name": "admin",
          name: "Shivani",
        },
      },
      query: {
        search: "report",
        $where: "this.password",
      },
      params: {
        id: "64f000000000000000000001",
      },
    };

    const next = runMongoSanitize(req);

    expect(req.body).toEqual({
      email: {},
      profile: {
        name: "Shivani",
      },
    });
    expect(req.query).toEqual({ search: "report" });
    expect(req.params).toEqual({ id: "64f000000000000000000001" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows localhost origins in non-production environments", () => {
    process.env.NODE_ENV = "development";
    process.env.CLIENT_URL = "";
    const callback = jest.fn();

    corsOptions.origin("http://localhost:5000", callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("rejects unconfigured non-local origins", () => {
    process.env.NODE_ENV = "development";
    process.env.CLIENT_URL = "";
    const callback = jest.fn();

    corsOptions.origin("https://example.com", callback);

    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });

  it("uses configured origins in production", () => {
    process.env.NODE_ENV = "production";
    process.env.CLIENT_URL = "https://app.example.com";
    const callback = jest.fn();

    corsOptions.origin("https://app.example.com", callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("rejects localhost origins in production when not configured", () => {
    process.env.NODE_ENV = "production";
    process.env.CLIENT_URL = "https://app.example.com";
    const callback = jest.fn();

    corsOptions.origin("http://localhost:5173", callback);

    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });
});
