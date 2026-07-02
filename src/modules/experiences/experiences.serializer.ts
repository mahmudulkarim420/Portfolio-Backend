import type { Experience } from '@prisma/client';

import type { LegacyExperience } from '../../types';

/**
 * Experience serializer (README §3.4).
 *
 * Transforms a Prisma `Experience` row into the
 * [`LegacyExperience`](src/types/index.ts:66) shape expected by the frontend.
 */
export function serializeExperience(experience: Experience): LegacyExperience {
  return {
    id: experience.id,
    role: experience.role,
    company: experience.company,
    startDate: experience.startDate,
    endDate: experience.endDate,
    period: experience.period,
    description: experience.description,
    order: experience.order,
  };
}
