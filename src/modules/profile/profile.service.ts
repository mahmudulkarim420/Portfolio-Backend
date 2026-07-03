import { prisma } from "../../config/prisma";
import { PROFILE_SINGLETON_ID } from "../../constants";
import { AppError, type LegacyProfile } from "../../types";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  uploadToCloudinary,
} from "../../uploads/upload.service";
import { serializeProfile } from "./profile.serializer";
import type { UpdateProfileInput } from "./profile.validation";

/**
 * Profile service (README §3.2).
 *
 * The profile is a singleton row (id = "singleton"). It is seeded once and
 * only updated thereafter.
 */

/**
 * Get the singleton profile, serialized to the legacy shape.
 * Throws `404` if the profile row does not exist.
 */
export async function getProfile(): Promise<LegacyProfile> {
  const profile = await prisma.profile.findUnique({
    where: { id: PROFILE_SINGLETON_ID },
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  return serializeProfile(profile);
}

/**
 * Update the singleton profile with the provided fields.
 * Returns the updated profile serialized to the legacy shape.
 */
export async function updateProfile(data: UpdateProfileInput): Promise<LegacyProfile> {
  // Ensure the singleton row exists before updating.
  const existing = await prisma.profile.findUnique({
    where: { id: PROFILE_SINGLETON_ID },
  });

  if (!existing) {
    throw new AppError("Profile not found", 404);
  }

  const updated = await prisma.profile.update({
    where: { id: PROFILE_SINGLETON_ID },
    data,
  });

  return serializeProfile(updated);
}

/**
 * Upload an avatar image to Cloudinary and store the URL on the profile.
 * Deletes the previous avatar from Cloudinary if one existed.
 * Returns the new Cloudinary URL.
 */
export async function uploadAvatar(buffer: Buffer, filename: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { id: PROFILE_SINGLETON_ID },
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  // Delete the previous avatar from Cloudinary (best-effort).
  if (profile.avatar) {
    const oldPublicId = extractPublicIdFromUrl(profile.avatar);
    await deleteFromCloudinary(oldPublicId, "image");
  }

  const result = await uploadToCloudinary(buffer, "portfolio/avatar", filename, "image");

  await prisma.profile.update({
    where: { id: PROFILE_SINGLETON_ID },
    data: { avatar: result.secureUrl },
  });

  return result.secureUrl;
}

/**
 * Upload a resume file (PDF) to Cloudinary and store the URL on the profile.
 * Deletes the previous resume from Cloudinary if one existed.
 * Returns the new Cloudinary URL.
 */
export async function uploadResume(buffer: Buffer, filename: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { id: PROFILE_SINGLETON_ID },
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  // Delete the previous resume from Cloudinary (best-effort).
  if (profile.resumeUrl) {
    const oldPublicId = extractPublicIdFromUrl(profile.resumeUrl, "raw");
    await deleteFromCloudinary(oldPublicId, "raw");
  }

  const result = await uploadToCloudinary(buffer, "portfolio/resume", filename, "raw");

  await prisma.profile.update({
    where: { id: PROFILE_SINGLETON_ID },
    data: { resumeUrl: result.secureUrl },
  });

  return result.secureUrl;
}
