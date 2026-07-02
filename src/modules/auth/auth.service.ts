import { prisma } from '../../config/prisma';
import { AppError, type SessionUser } from '../../types';
import { comparePassword, hashPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';

/**
 * Auth service (README §3.1, §5).
 *
 * There is exactly one admin user (seeded). No public sign-up exists.
 */

/** Shape returned by `POST /api/auth/login`. */
export interface AuthLoginResult {
  token: string;
  user: SessionUser;
}

/**
 * Convert a Prisma `User` row into the public `SessionUser` shape
 * (id, email, name) — never expose the password hash.
 */
export function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
}): SessionUser {
  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Validate credentials and issue a JWT.
 * Throws `401` if the email is unknown or the password does not match.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthLoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  // Use a single generic message to avoid user-enumeration.
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const sessionUser = toSessionUser(user);
  const token = signToken(sessionUser);

  return { token, user: sessionUser };
}

/**
 * Return the current authenticated user (already attached by `authenticate`).
 */
export function getCurrentUser(user: SessionUser): SessionUser {
  return user;
}

/**
 * Change the admin password.
 * Verifies the current password, then updates the stored hash.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}
