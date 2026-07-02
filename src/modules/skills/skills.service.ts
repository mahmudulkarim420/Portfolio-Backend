import { SkillLevel } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { PROFICIENCY_THRESHOLDS } from '../../constants';
import { AppError, type LegacySkill } from '../../types';
import { serializeSkill } from './skills.serializer';
import type { CreateSkillInput, UpdateSkillInput } from './skills.validation';

/**
 * Skills service (README §3.3, §7.3).
 *
 * `proficiency` (0–100) is the source of truth; `level` is derived and stored
 * for display. Skills are ordered by `order` then grouped by `category`.
 */

/**
 * Derive a SkillLevel from a proficiency score (README §7.3):
 * 0–33 → BEGINNER, 34–66 → INTERMEDIATE, 67–100 → ADVANCED.
 */
export function deriveLevel(proficiency: number): SkillLevel {
  if (proficiency <= PROFICIENCY_THRESHOLDS.BEGINNER_MAX) {
    return SkillLevel.BEGINNER;
  }
  if (proficiency <= PROFICIENCY_THRESHOLDS.INTERMEDIATE_MAX) {
    return SkillLevel.INTERMEDIATE;
  }
  return SkillLevel.ADVANCED;
}

/**
 * List all skills ordered by category then `order`.
 * Returns the legacy shape array.
 */
export async function getAllSkills(): Promise<LegacySkill[]> {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  return skills.map(serializeSkill);
}

/**
 * Get a single skill by id. Throws `404` if not found.
 */
export async function getSkillById(id: string): Promise<LegacySkill> {
  const skill = await prisma.skill.findUnique({ where: { id } });

  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  return serializeSkill(skill);
}

/**
 * Create a new skill. The `level` is derived from `proficiency`.
 */
export async function createSkill(
  data: CreateSkillInput,
): Promise<LegacySkill> {
  const level = deriveLevel(data.proficiency);

  const skill = await prisma.skill.create({
    data: {
      name: data.name,
      category: data.category,
      level,
      proficiency: data.proficiency,
      icon: data.icon,
      order: data.order,
    },
  });

  return serializeSkill(skill);
}

/**
 * Update an existing skill. If `proficiency` changes, `level` is re-derived.
 * Throws `404` if the skill does not exist.
 */
export async function updateSkill(
  id: string,
  data: UpdateSkillInput,
): Promise<LegacySkill> {
  const existing = await prisma.skill.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Skill not found', 404);
  }

  // Re-derive level only when proficiency is being updated.
  const updateData: UpdateSkillInput & { level?: SkillLevel } = { ...data };
  if (data.proficiency !== undefined) {
    updateData.level = deriveLevel(data.proficiency);
  }

  const updated = await prisma.skill.update({
    where: { id },
    data: updateData,
  });

  return serializeSkill(updated);
}

/**
 * Delete a skill by id. Throws `404` if the skill does not exist.
 */
export async function deleteSkill(id: string): Promise<void> {
  const existing = await prisma.skill.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Skill not found', 404);
  }

  await prisma.skill.delete({ where: { id } });
}
