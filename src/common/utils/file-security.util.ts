import crypto from "crypto";
import path from "path";
import { AppError } from "../errors/app-error";

const MB = 1024 * 1024;

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const pdfMimeTypes = new Set(["application/pdf"]);

const documentMimeTypes = new Set([
  ...imageMimeTypes,
  ...pdfMimeTypes,
  "text/plain",
  "text/csv",
  "application/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "application/har+json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const blockedExtensions = new Set([
  ".bat",
  ".cmd",
  ".com",
  ".exe",
  ".js",
  ".msi",
  ".ps1",
  ".sh",
  ".vbs",
]);

const imageExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const pdfExtensions = new Set([".pdf"]);

const documentExtensions = new Set([
  ".csv",
  ".doc",
  ".docx",
  ".gif",
  ".har",
  ".jpeg",
  ".jpg",
  ".json",
  ".log",
  ".mov",
  ".mp4",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".txt",
  ".webp",
  ".webm",
  ".xls",
  ".xlsx",
  ".zip",
]);

interface UploadFileValidationOptions {
  allowedMimeTypes: Set<string>;
  allowedExtensions: Set<string>;
  maxFileSize: number;
}

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const getFileExtension = (fileName: string) => {
  return path.extname(fileName).toLowerCase();
};

const validateUploadFile = (
  file: Express.Multer.File,
  options: UploadFileValidationOptions,
) => {
  const extension = getFileExtension(file.originalname);
  const mimeType = file.mimetype.toLowerCase();

  if (blockedExtensions.has(extension)) {
    throw createHttpError("This file type is not allowed");
  }

  if (!options.allowedMimeTypes.has(mimeType)) {
    throw createHttpError("Unsupported file type");
  }

  if (!options.allowedExtensions.has(extension)) {
    throw createHttpError("Unsupported file extension");
  }

  if (file.size > options.maxFileSize) {
    throw createHttpError("File is too large", 413);
  }

  return { extension, mimeType };
};

const sanitizeS3KeyPart = (value: string) => {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const createS3ObjectKey = (
  folder: string,
  prefix: string,
  originalName: string,
) => {
  const extension = getFileExtension(originalName);
  const safePrefix = sanitizeS3KeyPart(prefix) || "file";
  const id = crypto.randomUUID();

  return `${folder}/${safePrefix}-${id}${extension}`;
};

const FILE_UPLOAD_LIMITS = {
  image: 2 * MB,
  pdf: 5 * MB,
  attachment: 10 * MB,
  document: 10 * MB,
} as const;

const FILE_UPLOAD_RULES = {
  image: {
    allowedMimeTypes: imageMimeTypes,
    allowedExtensions: imageExtensions,
    maxFileSize: FILE_UPLOAD_LIMITS.image,
  },
  pdf: {
    allowedMimeTypes: pdfMimeTypes,
    allowedExtensions: pdfExtensions,
    maxFileSize: FILE_UPLOAD_LIMITS.pdf,
  },
  document: {
    allowedMimeTypes: documentMimeTypes,
    allowedExtensions: documentExtensions,
    maxFileSize: FILE_UPLOAD_LIMITS.document,
  },
  attachment: {
    allowedMimeTypes: documentMimeTypes,
    allowedExtensions: documentExtensions,
    maxFileSize: FILE_UPLOAD_LIMITS.attachment,
  },
} as const;

export {
  FILE_UPLOAD_LIMITS,
  FILE_UPLOAD_RULES,
  createS3ObjectKey,
  getFileExtension,
  validateUploadFile,
};
