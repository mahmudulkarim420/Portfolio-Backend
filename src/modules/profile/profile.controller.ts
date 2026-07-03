import type { Request, Response } from "express";

import { apiResponse } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { getProfile, updateProfile, uploadAvatar, uploadResume } from "./profile.service";
import type { UpdateProfileInput } from "./profile.validation";

/**
 * Profile controllers (README §3.2).
 */

/** `GET /api/profile` — public. */
export const getProfileController = asyncHandler(async (_req: Request, res: Response) => {
  const profile = await getProfile();
  return apiResponse.success(res, profile);
});

/** `PUT /api/profile` — admin. */
export const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateProfileInput;
  const profile = await updateProfile(data);
  return apiResponse.success(res, profile, "Profile updated successfully");
});

/** `POST /api/profile/avatar` — admin (multipart, field name "avatar"). */
export const uploadAvatarController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return apiResponse.error(res, 400, "No file uploaded");
  }

  const filename = `avatar-${Date.now()}`;
  const url = await uploadAvatar(req.file.buffer, filename);

  return apiResponse.success(res, { url }, "Avatar uploaded successfully");
});

/** `POST /api/profile/resume` — admin (multipart, field name "resume"). */
export const uploadResumeController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return apiResponse.error(res, 400, "No file uploaded");
  }

  const filename = `resume-${Date.now()}.pdf`;
  const url = await uploadResume(req.file.buffer, filename);

  return apiResponse.success(res, { url }, "Resume uploaded successfully");
});
