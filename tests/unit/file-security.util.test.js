"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_security_util_1 = require("../../src/common/utils/file-security.util");
const file = (overrides = {}) => ({
    originalname: "notes.txt",
    mimetype: "text/plain",
    size: 1024,
    buffer: Buffer.from("hello"),
    fieldname: "documents",
    encoding: "7bit",
    destination: "",
    filename: "",
    path: "",
    stream: undefined,
    ...overrides,
});
describe("file-security util", () => {
    it("accepts supported document files", () => {
        expect((0, file_security_util_1.validateUploadFile)(file(), file_security_util_1.FILE_UPLOAD_RULES.document)).toEqual({
            extension: ".txt",
            mimeType: "text/plain",
        });
    });
    it("rejects blocked executable extensions even when mime type looks safe", () => {
        expect(() => (0, file_security_util_1.validateUploadFile)(file({
            originalname: "deploy.sh",
            mimetype: "text/plain",
        }), file_security_util_1.FILE_UPLOAD_RULES.document)).toThrow("This file type is not allowed");
    });
    it("rejects files over the configured size limit with status 413", () => {
        try {
            (0, file_security_util_1.validateUploadFile)(file({
                size: file_security_util_1.FILE_UPLOAD_RULES.document.maxFileSize + 1,
            }), file_security_util_1.FILE_UPLOAD_RULES.document);
            throw new Error("Expected validation to fail");
        }
        catch (error) {
            expect(error.message).toBe("File is too large");
            expect(error.statusCode).toBe(413);
        }
    });
    it("sanitizes object key names and preserves the original extension", () => {
        const key = (0, file_security_util_1.createS3ObjectKey)("backend-saas/tenant-a/documents", "bug report #1", "screen shot.png");
        expect(key).toMatch(/^backend-saas\/tenant-a\/documents\/bug-report-1-[a-f0-9-]+\.png$/);
    });
});
