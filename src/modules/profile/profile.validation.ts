import { z } from 'zod';

/**
 * Zod schemas for the Profile module (README §3.2, §7.2).
 *
 * `PUT /api/profile` — all fields optional except `name`, `title`, `email`.
 */

/** `PUT /api/profile` body. */
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  title: z.string().min(1, 'Title is required').optional(),
  bio: z.string().optional(),
  email: z.string().email('A valid email is required').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  github: z.string().url('GitHub must be a valid URL').or(z.literal('')).optional(),
  linkedin: z.string().url('LinkedIn must be a valid URL').or(z.literal('')).optional(),
  twitter: z.string().url('Twitter must be a valid URL').or(z.literal('')).optional(),
  website: z.string().url('Website must be a valid URL').or(z.literal('')).optional(),
  avatar: z.string().optional(),
  resumeUrl: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
