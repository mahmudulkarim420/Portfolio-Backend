/**
 * Application-wide constants.
 */

export const API_PREFIX = '/api';

/** HTTP status codes used across the API. */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** Default pagination values. */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/** File upload limits (bytes). */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB

/** Allowed MIME types for uploads. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_RESUME_MIME_TYPES = ['application/pdf'] as const;

/** Proficiency → SkillLevel derivation thresholds (see README §7.3). */
export const PROFICIENCY_THRESHOLDS = {
  BEGINNER_MAX: 33,
  INTERMEDIATE_MAX: 66,
  // 67–100 → ADVANCED
} as const;

/** The singleton profile row id. */
export const PROFILE_SINGLETON_ID = 'singleton';
