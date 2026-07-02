import { z } from 'zod';

/**
 * Projects validation (README §3.5, §7.5).
 *
 * The most complex module: nested technologies, links, challenges, and
 * future plans are written via Prisma nested writes.
 */

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const titleSchema = z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters');
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be at most 100 characters')
  .regex(slugRegex, 'Slug must be lowercase kebab-case (e.g. "my-project")');
const subtitleSchema = z.string().max(100, 'Subtitle must be at most 100 characters').optional();
const imageSchema = z
  .string()
  .url('Image must be a valid URL')
  .or(z.literal(''))
  .optional();
const briefDescriptionSchema = z
  .string()
  .max(500, 'Brief description must be at most 500 characters')
  .optional();
const contentSchema = z
  .string()
  .max(20000, 'Content must be at most 20000 characters')
  .optional();
const publishedSchema = z.coerce.boolean().optional();
const orderSchema = z.coerce.number().int().min(0, 'Order must be at least 0').optional();

const technologySchema = z.object({
  name: z.string().min(1, 'Technology name is required'),
  fullWidth: z.coerce.boolean().default(false),
});

const linksSchema = z.object({
  live: z.string().optional(),
  clientRepo: z.string().optional(),
  serverRepo: z.string().optional(),
});

const stringArraySchema = z.array(z.string().min(1, 'Items must be non-empty strings')).optional();

/** `POST /api/projects` — create a project. */
export const createProjectSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  subtitle: subtitleSchema,
  image: imageSchema,
  briefDescription: briefDescriptionSchema,
  content: contentSchema,
  published: publishedSchema,
  order: z.coerce.number().int().min(0, 'Order must be at least 0').default(0),
  technologies: z.array(technologySchema).optional(),
  links: linksSchema.optional(),
  challengesFaced: stringArraySchema,
  futurePlans: stringArraySchema,
});

/** `PUT /api/projects/:id` — update a project (all fields optional). */
export const updateProjectSchema = z.object({
  title: titleSchema.optional(),
  slug: slugSchema.optional(),
  subtitle: subtitleSchema,
  image: imageSchema,
  briefDescription: briefDescriptionSchema,
  content: contentSchema,
  published: publishedSchema,
  order: orderSchema,
  technologies: z.array(technologySchema).optional(),
  links: linksSchema.optional(),
  challengesFaced: stringArraySchema,
  futurePlans: stringArraySchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
