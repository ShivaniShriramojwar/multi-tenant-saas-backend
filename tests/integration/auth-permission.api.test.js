"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const auth_middleware_1 = require("../../src/common/middleware/auth.middleware");
const roles_1 = require("../../src/common/constants/roles");
const auth_fixture_1 = require("../fixtures/auth.fixture");
const createAuthHarness = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get("/protected", auth_middleware_1.verifyToken, (_req, res) => {
        res.status(200).json({ message: "ok" });
    });
    app.post("/projects", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizePermission)("create_project"), (_req, res) => {
        res.status(201).json({ message: "created" });
    });
    app.post("/super-admin-only", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRoles)(roles_1.ROLES.SUPER_ADMIN), (_req, res) => {
        res.status(200).json({ message: "allowed" });
    });
    return app;
};
describe("auth and permission API middleware", () => {
    const app = createAuthHarness();
    it("returns 401 when JWT is missing", async () => {
        const response = await (0, supertest_1.default)(app).get("/protected");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Access denied. No token provided.");
    });
    it("returns 401 when JWT is invalid", async () => {
        const response = await (0, supertest_1.default)(app)
            .get("/protected")
            .set("Authorization", "Bearer not-a-real-token");
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid or expired token");
    });
    it("returns 403 when the user is authenticated but missing permission", async () => {
        const response = await (0, supertest_1.default)(app)
            .post("/projects")
            .set("Authorization", (0, auth_fixture_1.roleBearer)(roles_1.ROLES.DEVELOPER));
        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Permission denied: create_project");
    });
    it("blocks developers from Super Admin-only actions", async () => {
        const response = await (0, supertest_1.default)(app)
            .post("/super-admin-only")
            .set("Authorization", (0, auth_fixture_1.roleBearer)(roles_1.ROLES.DEVELOPER));
        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Access denied");
    });
    it("allows authorized users through", async () => {
        const response = await (0, supertest_1.default)(app)
            .post("/super-admin-only")
            .set("Authorization", (0, auth_fixture_1.bearer)());
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("allowed");
    });
});
