import type { Request, Response } from 'express';

import { apiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import {
  changePassword,
  getCurrentUser,
  login,
} from './auth.service';
import type { LoginInput, ChangePasswordInput } from './auth.validation';

/**
 * Auth controllers (README §3.1).
 *
 * Controllers only extract request data, call the service, and return a
 * uniform API response. No business logic lives here.
 */

/** `POST /api/auth/login` — public. */
export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginInput;

    const result = await login(email, password);

    return apiResponse.success(
      res,
      result,
      'Login successful',
    );
  },
);

/** `GET /api/auth/me` — admin. */
export const meController = asyncHandler(
  async (req: Request, res: Response) => {
    // `req.user` is guaranteed by the `authenticate` middleware.
    const user = getCurrentUser(req.user!);

    return apiResponse.success(res, user);
  },
);

/** `POST /api/auth/change-password` — admin. */
export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } =
      req.body as ChangePasswordInput;

    await changePassword(req.user!.id, currentPassword, newPassword);

    return apiResponse.success(
      res,
      null,
      'Password changed successfully',
    );
  },
);
