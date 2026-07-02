import { z } from 'zod';

/**
 * Experiences validation (README §3.4, §7.2, §12 note 4).
 *
 * The backend stores `startDate`, `endDate`, **and** `period`. If `period` is
 * omitted/empty it is derived as `"<startDate> - <endDate>"`.
 */

const roleSchema = z.string().min(1, 'Role is required').max(100, 'Role must be at most 100 characters');
const companySchema = z.string().min(1, 'Company is required').max(100, 'Company must be at most 100 characters');
const startDateSchema = z.string().min(1, 'Start date is required').max(30, 'Start date must be at most 30 characters');
const endDateSchema = z.string().min(1, 'End date is required').max(30, 'End date must be at most 30 characters');
const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(2000, 'Description must be at most 2000 characters');
const periodSchema = z.string().max(60, 'Period must be at most 60 characters').optional();
const orderSchema = z.coerce.number().int().min(0, 'Order must be at least 0').default(0);

/** `POST /api/experiences` — create an experience. */
export const createExperienceSchema = z.object({
  role: roleSchema,
  company: companySchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  period: periodSchema,
  description: descriptionSchema,
  order: orderSchema,
});

/** `PUT /api/experiences/:id` — update an experience (all fields optional). */
export const updateExperienceSchema = z.object({
  role: roleSchema.optional(),
  company: companySchema.optional(),
  startDate: startDateSchema.optional(),
  endDate: endDateSchema.optional(),
  period: periodSchema,
  description: descriptionSchema.optional(),
  order: z.coerce.number().int().min(0, 'Order must be at least 0').optional(),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
