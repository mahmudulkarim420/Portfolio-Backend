import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * Returns `true` if they match.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
