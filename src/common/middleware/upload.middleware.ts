import multer from "multer";
import {
  FILE_UPLOAD_LIMITS,
  FILE_UPLOAD_RULES,
  validateUploadFile,
} from "../utils/file-security.util";

const storage = multer.memoryStorage();

const createFileFilter =
  (rules: typeof FILE_UPLOAD_RULES[keyof typeof FILE_UPLOAD_RULES]) =>
  (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      validateUploadFile(file, rules);
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  };

const imageUpload = multer({
  storage,
  limits: {
    fileSize: FILE_UPLOAD_LIMITS.image,
  },
  fileFilter: createFileFilter(FILE_UPLOAD_RULES.image),
});

const pdfUpload = multer({
  storage,
  limits: {
    fileSize: FILE_UPLOAD_LIMITS.pdf,
  },
  fileFilter: createFileFilter(FILE_UPLOAD_RULES.pdf),
});

const attachmentUpload = multer({
  storage,
  limits: {
    fileSize: FILE_UPLOAD_LIMITS.attachment,
    files: 5,
  },
  fileFilter: createFileFilter(FILE_UPLOAD_RULES.attachment),
});

const documentUpload = multer({
  storage,
  limits: {
    fileSize: FILE_UPLOAD_LIMITS.document,
    files: 10,
  },
  fileFilter: createFileFilter(FILE_UPLOAD_RULES.document),
});

export { imageUpload, pdfUpload, attachmentUpload, documentUpload };
