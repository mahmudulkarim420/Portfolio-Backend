import type { Profile } from '@prisma/client';

import type { LegacyProfile } from '../../types';

/**
 * Profile serializer (README §2.4, §3.2).
 *
 * Transforms a Prisma `Profile` row into the exact `LegacyProfile` shape
 * the frontend expects, so the API response is drop-in compatible.
 */
export function serializeProfile(profile: Profile): LegacyProfile {
  return {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    bio: profile.bio,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    github: profile.github,
    linkedin: profile.linkedin,
    twitter: profile.twitter,
    website: profile.website,
    avatar: profile.avatar,
    resumeUrl: profile.resumeUrl,
  };
}
