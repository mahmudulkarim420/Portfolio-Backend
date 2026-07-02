import { z } from 'zod';

/**
 * Messages validation (README §3.6, §7.6).
 *
 * Public `POST /api/messages` accepts name, email, and message (10–2000 chars).
 */

/** `POST /api/messages` — submit a contact message (public). */
export const createMessageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('A valid email is required'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters'),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
