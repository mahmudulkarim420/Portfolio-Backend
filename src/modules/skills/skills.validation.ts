import { SkillCategory } from '@prisma/client';
import { z } from 'zod';

/**
 * Skills validation (README §3.3).
 *
 * The API accepts/returns human-readable category strings
 * ("Frontend Development" / "Backend Development") while the database stores
 * the Prisma enum. The schema below transforms the display string into the
 * enum value so the service layer works purely with enums.
 */

/** Map the frontend display string → Prisma enum. */
const CATEGORY_DISPLAY_TO_ENUM: Record<string, SkillCategory> = {
  'Frontend Development': SkillCategory.FRONTEND_DEVELOPMENT,
  'Backend Development': SkillCategory.BACKEND_DEVELOPMENT,
};

const categorySchema = z
  .string()
  .min(1, 'Category is required')
  .refine((val) => val in CATEGORY_DISPLAY_TO_ENUM, {
    message: 'Category must be "Frontend Development" or "Backend Development"',
  })
  .transform((val) => CATEGORY_DISPLAY_TO_ENUM[val]);

const proficiencySchema = z
  .number()
  .int('Proficiency must be a whole number')
  .min(0, 'Proficiency must be at least 0')
  .max(100, 'Proficiency must be at most 100');

/** `POST /api/skills` — create a skill. */
export const createSkillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: categorySchema,
  proficiency: proficiencySchema,
  icon: z.string().min(1, 'Icon is required').default('FiCode'),
  order: z.number().int().min(0, 'Order must be at least 0').default(0),
});

/** `PUT /api/skills/:id` — update a skill (all fields optional). */
export const updateSkillSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  category: categorySchema.optional(),
  proficiency: proficiencySchema.optional(),
  icon: z.string().min(1, 'Icon is required').optional(),
  order: z.number().int().min(0, 'Order must be at least 0').optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
