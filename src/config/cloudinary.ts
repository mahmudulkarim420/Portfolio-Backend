import { v2 as cloudinary } from 'cloudinary';

import { env } from './env';

/**
 * Configure the Cloudinary SDK with credentials from environment variables.
 * Used by the shared upload service for signed uploads from the backend.
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
