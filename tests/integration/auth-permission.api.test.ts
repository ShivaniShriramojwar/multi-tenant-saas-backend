import express from "express";
import request from "supertest";
import {
  authorizePermission,
  authorizeRoles,
  verifyToken,
} from "../../src/common/middleware/auth.middleware";
import { ROLES } from "../../src/common/constants/roles";
import { bearer, roleBearer } from "../fixtures/auth.fixture";

const createAuthHarness = () => {
  const app = express();
  app.use(express.json());

  app.get("/protected", verifyToken, (_req, res) => {
    res.status(200).json({ message: "ok" });
  });

  app.post(
    "/projects",
    verifyToken,
    authorizePermission("create_project"),
    (_req, res) => {
      res.status(201).json({ message: "created" });
    },
  );

  app.post(
    "/super-admin-only",
    verifyToken,
    authorizeRoles(ROLES.SUPER_ADMIN),
    (_req, res) => {
      res.status(200).json({ message: "allowed" });
    },
  );

  return app;
};

describe("auth and permission API middleware", () => {
  const app = createAuthHarness();

  it("returns 401 when JWT is missing", async () => {
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Access denied. No token provided.");
  });

  it("returns 401 when JWT is invalid", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer not-a-real-token");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("returns 403 when the user is authenticated but missing permission", async () => {
    const response = await request(app)
      .post("/projects")
      .set("Authorization", roleBearer(ROLES.DEVELOPER));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Permission denied: create_project");
  });

  it("blocks developers from Super Admin-only actions", async () => {
    const response = await request(app)
      .post("/super-admin-only")
      .set("Authorization", roleBearer(ROLES.DEVELOPER));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("allows authorized users through", async () => {
    const response = await request(app)
      .post("/super-admin-only")
      .set("Authorization", bearer());

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("allowed");
  });
});
