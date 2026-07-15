import { NextFunction, Request, Response } from "express";
import { mongoSanitize } from "../../src/common/middleware/security.middleware";

const runMongoSanitize = (req: Partial<Request>) => {
  const next = jest.fn() as NextFunction;

  mongoSanitize(req as Request, {} as Response, next);

  return next;
};

describe("security middleware", () => {
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
});
