import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

import { cloudinary } from '../config/cloudinary';
import { AppError } from '../types';

/**
 * Result of a successful Cloudinary upload.
 */
export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
}

/**
 * Uploads a file buffer to Cloudinary using a stream.
 *
 * @param buffer   The file contents (from multer memoryStorage).
 * @param folder   The Cloudinary folder to store the asset in.
 * @param filename A base filename (without extension) used for the public id.
 * @param resourceType `image` or `raw` (for PDFs / resumes).
 */
export function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'image' | 'raw' = 'image',
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: resourceType,
        unique_filename: true,
        overwrite: true,
      },
      (err?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (err || !result) {
          reject(
            new AppError(
              err?.message || 'Failed to upload file to Cloudinary.',
              500,
            ),
          );
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an asset from Cloudinary by its public id.
 * Silently resolves if the public id is empty (nothing to delete).
 */
export async function deleteFromCloudinary(
  publicId: string | null | undefined,
  resourceType: 'image' | 'raw' = 'image',
): Promise<void> {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Deletion failures should not break the main flow; log and continue.
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
  }
}

/**
 * Extracts the public id from a Cloudinary URL.
 * Example: https://res.cloudinary.com/demo/image/upload/v123/portfolio/avatar-abc.png
 *          → "portfolio/avatar-abc"
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/');
    // Remove the leading empty segment and the version segment ("v123").
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) {
      return null;
    }
    const relevant = parts.slice(uploadIndex + 1);
    // Drop the version segment if present.
    if (relevant[0] && /^v\d+$/.test(relevant[0])) {
      relevant.shift();
    }
    const last = relevant[relevant.length - 1];
    if (!last) {
      return null;
    }
    // Strip the file extension.
    const dotIndex = last.lastIndexOf('.');
    if (dotIndex > -1) {
      relevant[relevant.length - 1] = last.slice(0, dotIndex);
    }
    return relevant.join('/');
  } catch {
    return null;
  }
}
