import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import type { JwtPayload, SessionUser } from '../types';

/**
 * Sign a JWT for an authenticated admin user.
 *
 * Payload matches the frontend `SessionPayload` shape: `{ sub, email, name }`.
 */
export function signToken(user: SessionUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify a JWT and return its decoded payload.
 * Throws `jwt.TokenExpiredError` or `jwt.JsonWebTokenError` on failure.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Extract a bearer token from the Authorization header.
 * Returns `null` if the header is missing or malformed.
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] ?? null;
}
