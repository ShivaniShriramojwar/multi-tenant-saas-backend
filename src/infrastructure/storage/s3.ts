import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../../common/logger";

interface S3UploadInput {
  buffer: Buffer;
  key: string;
  contentType?: string;
}

interface S3DeleteInput {
  key: string;
}

interface S3SignedUrlInput {
  key: string;
  expiresIn?: number;
  filename?: string;
}

interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
}

const getS3Config = () => {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    throw new Error("AWS S3 environment variables are not configured");
  }

  return { bucket, region };
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

const encodeS3Key = (key: string) =>
  key.split("/").map(encodeURIComponent).join("/");

const getS3ObjectUrl = (bucket: string, region: string, key: string) => {
  const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${encodeS3Key(key)}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeS3Key(key)}`;
};

const getContentDisposition = (filename?: string) => {
  if (!filename) {
    return undefined;
  }

  const fallbackFilename = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");

  return `inline; filename="${fallbackFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

const uploadToS3 = async ({
  buffer,
  key,
  contentType,
}: S3UploadInput): Promise<S3UploadResult> => {
  const { bucket, region } = getS3Config();

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  } catch (error) {
    logger.error({ err: error, bucket, key }, "S3 upload failed");
    throw error;
  }

  return {
    url: getS3ObjectUrl(bucket, region, key),
    key,
    bucket,
  };
};

const deleteFromS3 = async ({ key }: S3DeleteInput) => {
  const { bucket } = getS3Config();

  try {
    return await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (error) {
    logger.error({ err: error, bucket, key }, "S3 delete failed");
    throw error;
  }
};

const getS3SignedDownloadUrl = async ({
  key,
  expiresIn = 300,
  filename,
}: S3SignedUrlInput) => {
  const { bucket } = getS3Config();

  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: getContentDisposition(filename),
      }),
      { expiresIn },
    );
  } catch (error) {
    logger.error({ err: error, bucket, key }, "S3 signed URL generation failed");
    throw error;
  }
};

export {
  uploadToS3,
  deleteFromS3,
  getS3SignedDownloadUrl,
  getS3Config,
  s3Client,
};
