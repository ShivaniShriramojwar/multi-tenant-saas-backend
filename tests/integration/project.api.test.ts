import express from "express";
import request from "supertest";
import projectRoutes from "../../src/modules/project/project.routes";
import { errorHandler } from "../../src/common/middleware/error.middleware";
import { ROLES } from "../../src/common/constants/roles";
import { roleBearer } from "../fixtures/auth.fixture";
import { getProjectByIdService } from "../../src/modules/project/project.service";

jest.mock("../../src/modules/project/project.service", () => ({
  createProjectService: jest.fn(),
  deleteProjectService: jest.fn(),
  getProjectByIdService: jest.fn(),
  getProjectsService: jest.fn(),
  updateProjectService: jest.fn(),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/projects", projectRoutes);
  app.use(errorHandler);
  return app;
};

describe("project API validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a clean 400 for invalid ObjectId params", async () => {
    const response = await request(createApp())
      .get("/projects/not-an-object-id")
      .set("Authorization", roleBearer(ROLES.SUPER_ADMIN));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid id");
    expect(getProjectByIdService).not.toHaveBeenCalled();
  });
});
