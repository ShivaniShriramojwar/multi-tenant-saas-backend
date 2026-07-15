"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const project_routes_1 = __importDefault(require("../../src/modules/project/project.routes"));
const error_middleware_1 = require("../../src/common/middleware/error.middleware");
const roles_1 = require("../../src/common/constants/roles");
const auth_fixture_1 = require("../fixtures/auth.fixture");
const project_service_1 = require("../../src/modules/project/project.service");
jest.mock("../../src/modules/project/project.service", () => ({
    createProjectService: jest.fn(),
    deleteProjectService: jest.fn(),
    getProjectByIdService: jest.fn(),
    getProjectsService: jest.fn(),
    updateProjectService: jest.fn(),
}));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use("/projects", project_routes_1.default);
    app.use(error_middleware_1.errorHandler);
    return app;
};
describe("project API validation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("returns a clean 400 for invalid ObjectId params", async () => {
        const response = await (0, supertest_1.default)(createApp())
            .get("/projects/not-an-object-id")
            .set("Authorization", (0, auth_fixture_1.roleBearer)(roles_1.ROLES.SUPER_ADMIN));
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid id");
        expect(project_service_1.getProjectByIdService).not.toHaveBeenCalled();
    });
});
