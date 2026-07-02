import { z } from 'zod';

/**
 * Zod schemas for the Auth module (README §3.1, §7.1).
 *
 * - `loginSchema`        → `POST /api/auth/login` body
 * - `changePasswordSchema` → `POST /api/auth/change-password` body
 */

/** `POST /api/auth/login` — email + password (min 8 chars). */
export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** `POST /api/auth/change-password` — current + new password (must differ). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must differ from the current password',
    path: ['newPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
