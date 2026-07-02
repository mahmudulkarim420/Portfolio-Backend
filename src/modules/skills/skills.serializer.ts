import type { Skill } from '@prisma/client';

import type { LegacySkill } from '../../types';

/**
 * Skill serializer (README §3.3, §7.3).
 *
 * Transforms a Prisma `Skill` row into the [`LegacySkill`](src/types/index.ts:56)
 * shape expected by the frontend: enum values become human-readable display
 * strings ("Frontend Development", "Beginner", …).
 */

const CATEGORY_ENUM_TO_DISPLAY: Record<string, string> = {
  FRONTEND_DEVELOPMENT: 'Frontend Development',
  BACKEND_DEVELOPMENT: 'Backend Development',
};

const LEVEL_ENUM_TO_DISPLAY: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export function serializeSkill(skill: Skill): LegacySkill {
  return {
    id: skill.id,
    name: skill.name,
    category: CATEGORY_ENUM_TO_DISPLAY[skill.category] ?? skill.category,
    level: LEVEL_ENUM_TO_DISPLAY[skill.level] ?? skill.level,
    proficiency: skill.proficiency,
    icon: skill.icon,
    order: skill.order,
  };
}
