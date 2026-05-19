import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export async function uploadImage(
  file: Buffer | string,
  options?: { folder?: string; publicId?: string; transformation?: object }
): Promise<UploadResult> {
  const uploadOptions = {
    folder: options?.folder || "tea-erp",
    public_id: options?.publicId,
    resource_type: "image" as const,
    transformation: options?.transformation || { quality: "auto", fetch_format: "auto" },
    overwrite: true,
  };

  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    if (Buffer.isBuffer(file)) {
      uploadStream.end(file);
    } else {
      // Base64 string
      cloudinary.uploader.upload(file, uploadOptions).then(resolve).catch(reject);
    }
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}

export function getOptimizedUrl(publicId: string, options?: { width?: number; height?: number; crop?: string }): string {
  return cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
    width: options?.width,
    height: options?.height,
    crop: options?.crop || "fill",
    secure: true,
  });
}

export { cloudinary };
