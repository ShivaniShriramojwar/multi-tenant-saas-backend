import {
  getDocumentDownloadUrlService,
} from "../../src/modules/document/document.service";
import { getDocumentById } from "../../src/modules/document/document.repository";
import { getS3SignedDownloadUrl } from "../../src/infrastructure/storage/s3";
import { tenantAId, tenantBId } from "../fixtures/auth.fixture";

jest.mock("../../src/modules/document/document.repository", () => ({
  createDocument: jest.fn(),
  deleteDocumentById: jest.fn(),
  getDocumentById: jest.fn(),
  getDocumentsByTenant: jest.fn(),
  updateDocumentById: jest.fn(),
}));

jest.mock("../../src/infrastructure/storage/s3", () => ({
  deleteFromS3: jest.fn(),
  getS3SignedDownloadUrl: jest.fn(),
  uploadToS3: jest.fn(),
}));

jest.mock("../../src/modules/audit/audit.service", () => ({
  createAuditLog: jest.fn(),
}));

jest.mock("../../src/infrastructure/socket/socket", () => ({
  emitTenantNotification: jest.fn(),
}));

jest.mock("../../src/modules/project/project.repository", () => ({
  getProjectByIdAndTenant: jest.fn(),
}));

jest.mock("../../src/modules/task/task.repository", () => ({
  getTaskById: jest.fn(),
}));

jest.mock("../../src/modules/bug/bug.repository", () => ({
  getBugById: jest.fn(),
}));

jest.mock("../../src/modules/comment/comment.repository", () => ({
  getCommentById: jest.fn(),
}));

jest.mock("../../src/modules/order/order.repository", () => ({
  getOrderById: jest.fn(),
}));

jest.mock("../../src/modules/user/user.repository", () => ({
  getUserById: jest.fn(),
}));

const documentId = "64f000000000000000000401";

const documentRecord = (tenantId = tenantAId, resourceType = "s3") => ({
  _id: documentId,
  tenantId: {
    toString: () => tenantId,
  },
  resourceType,
  publicId: "backend-saas/tenant-a/documents/spec.txt",
  originalName: "spec.txt",
});

describe("document service signed download authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AWS_S3_SIGNED_URL_EXPIRES_IN = "600";
  });

  it("does not generate signed URLs for documents outside the tenant", async () => {
    (getDocumentById as jest.Mock).mockResolvedValue(documentRecord(tenantBId));

    await expect(
      getDocumentDownloadUrlService(documentId, tenantAId),
    ).rejects.toMatchObject({
      message: "Document not found",
      statusCode: 404,
    });

    expect(getS3SignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("generates signed URLs only after tenant authorization succeeds", async () => {
    (getDocumentById as jest.Mock).mockResolvedValue(documentRecord(tenantAId));
    (getS3SignedDownloadUrl as jest.Mock).mockResolvedValue(
      "https://signed.example/spec.txt",
    );

    const result = await getDocumentDownloadUrlService(documentId, tenantAId);

    expect(getS3SignedDownloadUrl).toHaveBeenCalledWith({
      key: "backend-saas/tenant-a/documents/spec.txt",
      filename: "spec.txt",
      expiresIn: 600,
    });
    expect(result).toEqual({
      downloadUrl: "https://signed.example/spec.txt",
      expiresIn: 600,
      expiresAt: expect.any(Date),
    });
  });

  it("returns a clean 400 for non-S3 documents without signing", async () => {
    (getDocumentById as jest.Mock).mockResolvedValue(
      documentRecord(tenantAId, "cloudinary"),
    );

    await expect(
      getDocumentDownloadUrlService(documentId, tenantAId),
    ).rejects.toMatchObject({
      message: "Signed download URL is only available for S3 documents",
      statusCode: 400,
    });

    expect(getS3SignedDownloadUrl).not.toHaveBeenCalled();
  });
});
