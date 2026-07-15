import {
  FILE_UPLOAD_RULES,
  createS3ObjectKey,
  validateUploadFile,
} from "../../src/common/utils/file-security.util";

const file = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    originalname: "notes.txt",
    mimetype: "text/plain",
    size: 1024,
    buffer: Buffer.from("hello"),
    fieldname: "documents",
    encoding: "7bit",
    destination: "",
    filename: "",
    path: "",
    stream: undefined as any,
    ...overrides,
  });

describe("file-security util", () => {
  it("accepts supported document files", () => {
    expect(validateUploadFile(file(), FILE_UPLOAD_RULES.document)).toEqual({
      extension: ".txt",
      mimeType: "text/plain",
    });
  });

  it("rejects blocked executable extensions even when mime type looks safe", () => {
    expect(() =>
      validateUploadFile(
        file({
          originalname: "deploy.sh",
          mimetype: "text/plain",
        }),
        FILE_UPLOAD_RULES.document,
      ),
    ).toThrow("This file type is not allowed");
  });

  it("rejects files over the configured size limit with status 413", () => {
    try {
      validateUploadFile(
        file({
          size: FILE_UPLOAD_RULES.document.maxFileSize + 1,
        }),
        FILE_UPLOAD_RULES.document,
      );
      throw new Error("Expected validation to fail");
    } catch (error: any) {
      expect(error.message).toBe("File is too large");
      expect(error.statusCode).toBe(413);
    }
  });

  it("sanitizes object key names and preserves the original extension", () => {
    const key = createS3ObjectKey(
      "backend-saas/tenant-a/documents",
      "bug report #1",
      "screen shot.png",
    );

    expect(key).toMatch(
      /^backend-saas\/tenant-a\/documents\/bug-report-1-[a-f0-9-]+\.png$/,
    );
  });
});
