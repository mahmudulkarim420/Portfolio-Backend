import type { Request, Response, NextFunction } from 'express';

import { HttpStatus } from '../constants';
import { AppError, type SessionUser } from '../types';
import { extractBearerToken, verifyToken } from '../utils/jwt';

/**
 * Authentication middleware.
 *
 * Verifies the JWT from the `Authorization: Bearer <token>` header (or an
 * `access_token` cookie as a fallback), then attaches the decoded user
 * (`{ id, email, name }`) to `req.user`.
 *
 * Rejects with `401` if the token is missing, malformed, or expired.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token =
    extractBearerToken(req.headers.authorization) ??
    (typeof req.cookies?.access_token === 'string' ? req.cookies.access_token : null);

  if (!token) {
    next(new AppError('Authentication required. Please provide a valid token.', HttpStatus.UNAUTHORIZED));
    return;
  }

  try {
    const decoded = verifyToken(token);

    const user: SessionUser = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };

    req.user = user;
    next();
  } catch {
    next(new AppError('Invalid or expired token. Please log in again.', HttpStatus.UNAUTHORIZED));
  }
}
