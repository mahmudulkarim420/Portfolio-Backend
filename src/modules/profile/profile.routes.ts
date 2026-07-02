import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { handleMulterUpload, uploadImage, uploadResume } from '../../middlewares/upload';
import {
  getProfileController,
  updateProfileController,
  uploadAvatarController,
  uploadResumeController,
} from './profile.controller';
import { updateProfileSchema } from './profile.validation';

/**
 * Profile routes (README §3.2).
 *
 * | Method | Endpoint                | Auth  |
 * |--------|-------------------------|-------|
 * | GET    | /api/profile            | Public |
 * | PUT    | /api/profile            | Admin  |
 * | POST   | /api/profile/avatar     | Admin  |
 * | POST   | /api/profile/resume     | Admin  |
 */
const router = Router();

// Public
router.get('/', getProfileController);

// Admin (JWT required)
router.put(
  '/',
  authenticate,
  validate(updateProfileSchema),
  updateProfileController,
);

router.post(
  '/avatar',
  authenticate,
  handleMulterUpload(uploadImage.single('avatar')),
  uploadAvatarController,
);

router.post(
  '/resume',
  authenticate,
  handleMulterUpload(uploadResume.single('resume')),
  uploadResumeController,
);

export const profileRouter = router;
