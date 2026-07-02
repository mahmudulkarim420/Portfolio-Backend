import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  changePasswordController,
  loginController,
  meController,
} from './auth.controller';
import {
  changePasswordSchema,
  loginSchema,
} from './auth.validation';

/**
 * Auth routes (README §3.1).
 *
 * | Method | Endpoint              | Auth   |
 * |--------|-----------------------|--------|
 * | POST   | /api/auth/login       | Public |
 * | GET    | /api/auth/me          | Admin  |
 * | POST   | /api/auth/change-password | Admin |
 */
const router = Router();

// Public
router.post('/login', validate(loginSchema), loginController);

// Admin (JWT required)
router.get('/me', authenticate, meController);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePasswordController,
);

export const authRouter = router;
