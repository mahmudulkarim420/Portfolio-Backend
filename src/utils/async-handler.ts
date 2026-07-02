import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../types';

/**
 * Wrap an async route handler so rejected promises are forwarded to Express's
 * error-handling middleware instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      next(error);
    });
  };
}
