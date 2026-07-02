import { prisma } from '../../config/prisma';
import { AppError, type LegacyExperience } from '../../types';
import { serializeExperience } from './experiences.serializer';
import type { CreateExperienceInput, UpdateExperienceInput } from './experiences.validation';

/**
 * Experiences service (README §3.4, §12 note 4).
 *
 * The backend stores `startDate`, `endDate`, **and** `period`. If `period` is
 * empty/omitted it is derived as `"<startDate> - <endDate>"`.
 */

/**
 * Derive the display `period` string from start/end dates.
 * Returns `"<startDate> - <endDate>"`.
 */
export function derivePeriod(startDate: string, endDate: string): string {
  return `${startDate} - ${endDate}`;
}

/**
 * List all experiences ordered by `order`.
 * Returns the legacy shape array.
 */
export async function getAllExperiences(): Promise<LegacyExperience[]> {
  const experiences = await prisma.experience.findMany({
    orderBy: { order: 'asc' },
  });
  return experiences.map(serializeExperience);
}

/**
 * Get a single experience by id. Throws `404` if not found.
 */
export async function getExperienceById(id: string): Promise<LegacyExperience> {
  const experience = await prisma.experience.findUnique({ where: { id } });

  if (!experience) {
    throw new AppError('Experience not found', 404);
  }

  return serializeExperience(experience);
}

/**
 * Create a new experience. If `period` is empty/omitted it is derived from
 * `startDate` and `endDate`.
 */
export async function createExperience(
  data: CreateExperienceInput,
): Promise<LegacyExperience> {
  const period =
    data.period && data.period.trim().length > 0
      ? data.period
      : derivePeriod(data.startDate, data.endDate);

  const experience = await prisma.experience.create({
    data: {
      role: data.role,
      company: data.company,
      startDate: data.startDate,
      endDate: data.endDate,
      period,
      description: data.description,
      order: data.order,
    },
  });

  return serializeExperience(experience);
}

/**
 * Update an existing experience. If `period` is explicitly empty and either
 * `startDate` or `endDate` changed, the period is re-derived.
 * Throws `404` if the experience does not exist.
 */
export async function updateExperience(
  id: string,
  data: UpdateExperienceInput,
): Promise<LegacyExperience> {
  const existing = await prisma.experience.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Experience not found', 404);
  }

  // Resolve the effective start/end dates (existing or updated).
  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;

  // Re-derive period when it is explicitly empty OR when dates changed and
  // no explicit period was supplied.
  let period = data.period;
  if (period === undefined) {
    // No period field supplied — keep existing unless dates changed.
    if (data.startDate !== undefined || data.endDate !== undefined) {
      period = derivePeriod(startDate, endDate);
    } else {
      period = existing.period;
    }
  } else if (period.trim().length === 0) {
    // Explicitly empty period — derive from dates.
    period = derivePeriod(startDate, endDate);
  }

  const updated = await prisma.experience.update({
    where: { id },
    data: {
      ...(data.role !== undefined && { role: data.role }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      period,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  return serializeExperience(updated);
}

/**
 * Delete an experience by id. Throws `404` if it does not exist.
 */
export async function deleteExperience(id: string): Promise<void> {
  const existing = await prisma.experience.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Experience not found', 404);
  }

  await prisma.experience.delete({ where: { id } });
}
