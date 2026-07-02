import type { Request, Response, NextFunction } from 'express';
import multer, { type FileFilterCallback } from 'multer';

import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_RESUME_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_RESUME_SIZE,
} from '../constants';
import { AppError } from '../types';

/**
 * Multer is configured with `memoryStorage` so that files are kept in memory
 * as `Buffer`s and streamed directly to Cloudinary by the upload service.
 * This avoids writing temporary files to disk.
 */
const storage = multer.memoryStorage();

/**
 * Builds a file filter that only accepts the given MIME types.
 */
function buildFileFilter(allowed: readonly string[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ): void => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `File type ${file.mimetype} is not allowed. Allowed types: ${allowed.join(', ')}`,
          400,
        ),
      );
    }
  };
}

/** Multer instance for image uploads (avatar, project images). */
export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: buildFileFilter(ALLOWED_IMAGE_MIME_TYPES),
});

/** Multer instance for resume uploads (PDF only). */
export const uploadResume = multer({
  storage,
  limits: { fileSize: MAX_RESUME_SIZE },
  fileFilter: buildFileFilter(ALLOWED_RESUME_MIME_TYPES),
});

/**
 * Wrapper that runs a multer middleware and converts Multer errors into
 * `AppError`s so they flow through the centralized error handler.
 */
export function handleMulterUpload(
  middleware: (req: Request, res: Response, cb: (err?: unknown) => void) => void,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (err?: unknown) => {
      if (!err) {
        next();
        return;
      }

      // Multer file-size / unexpected-field errors carry a `code` property.
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new AppError('File size exceeds the allowed limit.', 400));
          return;
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          next(new AppError(`Unexpected field name: ${err.field}.`, 400));
          return;
        }
        next(new AppError(err.message || 'File upload error.', 400));
        return;
      }

      next(err);
    });
  };
}
