import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadInput {
  buffer: Buffer;
  folder: string;
  resourceType?: UploadApiOptions["resource_type"];
  publicId?: string;
}

interface CloudinaryDeleteInput {
  publicId: string;
  resourceType?: UploadApiOptions["resource_type"];
}

const uploadToCloudinary = async ({
  buffer,
  folder,
  resourceType = "auto",
  publicId,
}: CloudinaryUploadInput): Promise<UploadApiResponse> => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async ({
  publicId,
  resourceType = "image",
}: CloudinaryDeleteInput) => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export { uploadToCloudinary, deleteFromCloudinary };
