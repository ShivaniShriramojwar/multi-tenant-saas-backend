import express from "express";
import request from "supertest";
import documentRoutes from "../../src/modules/document/document.routes";
import { errorHandler } from "../../src/common/middleware/error.middleware";
import { ROLES } from "../../src/common/constants/roles";
import { roleBearer, tenantAId } from "../fixtures/auth.fixture";
import { uploadDocumentsService } from "../../src/modules/document/document.service";

jest.mock("../../src/modules/document/document.service", () => ({
  deleteDocumentService: jest.fn(),
  getDocumentByIdService: jest.fn(),
  getDocumentDownloadUrlService: jest.fn(),
  getDocumentsService: jest.fn(),
  updateDocumentService: jest.fn(),
  uploadDocumentsService: jest.fn(),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/documents", documentRoutes);
  app.use(errorHandler);
  return app;
};

describe("document upload API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads files only for authorized users", async () => {
    (uploadDocumentsService as jest.Mock).mockResolvedValue([
      {
        _id: "64f000000000000000000501",
        tenantId: tenantAId,
        name: "Spec",
      },
    ]);

    const response = await request(createApp())
      .post("/documents")
      .set("Authorization", roleBearer(ROLES.SUPER_ADMIN))
      .field("projectId", "64f000000000000000000301")
      .field("name", "Spec")
      .attach("documents", Buffer.from("hello"), {
        filename: "spec.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Documents uploaded successfully");
    expect(uploadDocumentsService).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "64f000000000000000000301",
        name: "Spec",
      }),
      tenantAId,
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({
          originalname: "spec.txt",
          mimetype: "text/plain",
        }),
      ]),
    );
  });

  it("rejects blocked file extensions before service work runs", async () => {
    const response = await request(createApp())
      .post("/documents")
      .set("Authorization", roleBearer(ROLES.SUPER_ADMIN))
      .field("projectId", "64f000000000000000000301")
      .attach("documents", Buffer.from("echo unsafe"), {
        filename: "run.sh",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("This file type is not allowed");
    expect(uploadDocumentsService).not.toHaveBeenCalled();
  });
});
