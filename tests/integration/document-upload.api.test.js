"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const document_routes_1 = __importDefault(require("../../src/modules/document/document.routes"));
const error_middleware_1 = require("../../src/common/middleware/error.middleware");
const roles_1 = require("../../src/common/constants/roles");
const auth_fixture_1 = require("../fixtures/auth.fixture");
const document_service_1 = require("../../src/modules/document/document.service");
jest.mock("../../src/modules/document/document.service", () => ({
    deleteDocumentService: jest.fn(),
    getDocumentByIdService: jest.fn(),
    getDocumentDownloadUrlService: jest.fn(),
    getDocumentsService: jest.fn(),
    updateDocumentService: jest.fn(),
    uploadDocumentsService: jest.fn(),
}));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use("/documents", document_routes_1.default);
    app.use(error_middleware_1.errorHandler);
    return app;
};
describe("document upload API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("uploads files only for authorized users", async () => {
        document_service_1.uploadDocumentsService.mockResolvedValue([
            {
                _id: "64f000000000000000000501",
                tenantId: auth_fixture_1.tenantAId,
                name: "Spec",
            },
        ]);
        const response = await (0, supertest_1.default)(createApp())
            .post("/documents")
            .set("Authorization", (0, auth_fixture_1.roleBearer)(roles_1.ROLES.SUPER_ADMIN))
            .field("projectId", "64f000000000000000000301")
            .field("name", "Spec")
            .attach("documents", Buffer.from("hello"), {
            filename: "spec.txt",
            contentType: "text/plain",
        });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Documents uploaded successfully");
        expect(document_service_1.uploadDocumentsService).toHaveBeenCalledWith(expect.objectContaining({
            projectId: "64f000000000000000000301",
            name: "Spec",
        }), auth_fixture_1.tenantAId, expect.any(String), expect.arrayContaining([
            expect.objectContaining({
                originalname: "spec.txt",
                mimetype: "text/plain",
            }),
        ]));
    });
    it("rejects blocked file extensions before service work runs", async () => {
        const response = await (0, supertest_1.default)(createApp())
            .post("/documents")
            .set("Authorization", (0, auth_fixture_1.roleBearer)(roles_1.ROLES.SUPER_ADMIN))
            .field("projectId", "64f000000000000000000301")
            .attach("documents", Buffer.from("echo unsafe"), {
            filename: "run.sh",
            contentType: "text/plain",
        });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("This file type is not allowed");
        expect(document_service_1.uploadDocumentsService).not.toHaveBeenCalled();
    });
});
