import { prisma } from '../../config/prisma';
import { AppError, type LegacyProject } from '../../types';
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  uploadToCloudinary,
} from '../../uploads/upload.service';
import { serializeProject, serializeProjects, type ProjectWithRelations } from './projects.serializer';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validation';

/**
 * Projects service (README §3.5).
 *
 * The most complex module: nested writes for technologies, links, challenges,
 * and future plans. Public endpoints filter by `published = true`; admin
 * endpoints return all projects including drafts.
 */

/** Prisma include object for all nested relations. */
const PROJECT_INCLUDE = {
  technologies: true,
  links: true,
  challenges: { orderBy: { order: 'asc' as const } },
  futurePlans: { orderBy: { order: 'asc' as const } },
} as const;

/**
 * List **published** projects ordered by `order` (public endpoint).
 */
export async function getPublishedProjects(): Promise<LegacyProject[]> {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
    include: PROJECT_INCLUDE,
  });
  return serializeProjects(projects as ProjectWithRelations[]);
}

/**
 * List **all** projects including drafts, ordered by `order` (admin endpoint).
 */
export async function getAllProjects(): Promise<LegacyProject[]> {
  const projects = await prisma.project.findMany({
    orderBy: { order: 'asc' },
    include: PROJECT_INCLUDE,
  });
  return serializeProjects(projects as ProjectWithRelations[]);
}

/**
 * Get a single **published** project by slug (public endpoint).
 * Throws `404` if not found or not published.
 */
export async function getPublishedProjectBySlug(
  slug: string,
): Promise<LegacyProject> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: PROJECT_INCLUDE,
  });

  if (!project || !project.published) {
    throw new AppError('Project not found', 404);
  }

  return serializeProject(project as ProjectWithRelations);
}

/**
 * Get any project by id, including drafts (admin endpoint).
 * Throws `404` if not found.
 */
export async function getProjectById(id: string): Promise<LegacyProject> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: PROJECT_INCLUDE,
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return serializeProject(project as ProjectWithRelations);
}

/**
 * Create a new project with nested writes for technologies, links, challenges,
 * and future plans.
 */
export async function createProject(
  data: CreateProjectInput,
): Promise<LegacyProject> {
  // Check slug uniqueness up-front for a clean 409 error.
  const existing = await prisma.project.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) {
    throw new AppError('A project with this slug already exists', 409);
  }

  const project = await prisma.project.create({
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? '',
      image: data.image ?? '',
      briefDescription: data.briefDescription ?? '',
      content: data.content ?? '',
      published: data.published ?? false,
      order: data.order,
      technologies: data.technologies
        ? { create: data.technologies }
        : undefined,
      links: data.links ? { create: data.links } : undefined,
      challenges: data.challengesFaced
        ? {
            create: data.challengesFaced.map((text, index) => ({
              text,
              order: index,
            })),
          }
        : undefined,
      futurePlans: data.futurePlans
        ? {
            create: data.futurePlans.map((text, index) => ({
              text,
              order: index,
            })),
          }
        : undefined,
    },
    include: PROJECT_INCLUDE,
  });

  return serializeProject(project as ProjectWithRelations);
}

/**
 * Update an existing project. Nested arrays (technologies, challenges,
 * futurePlans) are replaced wholesale when supplied; links are upserted.
 * Throws `404` if the project does not exist.
 */
export async function updateProject(
  id: string,
  data: UpdateProjectInput,
): Promise<LegacyProject> {
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Project not found', 404);
  }

  // If slug is changing, verify uniqueness.
  if (data.slug !== undefined) {
    const slugConflict = await prisma.project.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (slugConflict && slugConflict.id !== id) {
      throw new AppError('A project with this slug already exists', 409);
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.briefDescription !== undefined && {
        briefDescription: data.briefDescription,
      }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.order !== undefined && { order: data.order }),
      // Nested: replace technologies wholesale when supplied.
      ...(data.technologies !== undefined && {
        technologies: {
          deleteMany: {},
          create: data.technologies,
        },
      }),
      // Nested: upsert links when supplied.
      ...(data.links !== undefined && {
        links: {
          upsert: {
            create: data.links,
            update: data.links,
          },
        },
      }),
      // Nested: replace challenges wholesale when supplied.
      ...(data.challengesFaced !== undefined && {
        challenges: {
          deleteMany: {},
          create: data.challengesFaced.map((text, index) => ({
            text,
            order: index,
          })),
        },
      }),
      // Nested: replace future plans wholesale when supplied.
      ...(data.futurePlans !== undefined && {
        futurePlans: {
          deleteMany: {},
          create: data.futurePlans.map((text, index) => ({
            text,
            order: index,
          })),
        },
      }),
    },
    include: PROJECT_INCLUDE,
  });

  return serializeProject(project as ProjectWithRelations);
}

/**
 * Delete a project by id. Throws `404` if it does not exist.
 * Cascade deletes handle the nested relations automatically.
 */
export async function deleteProject(id: string): Promise<void> {
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true, image: true },
  });

  if (!existing) {
    throw new AppError('Project not found', 404);
  }

  await prisma.project.delete({ where: { id } });
}

/**
 * Upload a project hero image to Cloudinary and store the URL on the project.
 * Deletes the previous image (if any) before uploading the new one.
 * Throws `404` if the project does not exist.
 */
export async function uploadProjectImage(
  id: string,
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true, image: true },
  });

  if (!existing) {
    throw new AppError('Project not found', 404);
  }

  // Delete the previous image from Cloudinary (best-effort).
  if (existing.image) {
    const publicId = extractPublicIdFromUrl(existing.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'image').catch(() => {
        // Best-effort: ignore delete failures.
      });
    }
  }

  const result = await uploadToCloudinary(buffer, 'portfolio/projects', filename, 'image');

  await prisma.project.update({
    where: { id },
    data: { image: result.secureUrl },
  });

  return result.secureUrl;
}
