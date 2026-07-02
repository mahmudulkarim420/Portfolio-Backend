import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { HttpStatus } from '../constants';
import { AppError, type ApiResponse } from '../types';

/**
 * Centralized error-handling middleware.
 *
 * Converts any thrown error into a consistent JSON response:
 * `{ success: false, message, errors? }`.
 *
 * - `AppError` → uses its `statusCode` and `errors`.
 * - `ZodError` → 422 with field errors.
 * - Prisma known errors → mapped to appropriate status codes.
 * - Everything else → 500 (with stack trace in development only).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the error for debugging
  console.error('Error:', err);

  // ---- AppError (operational errors we throw intentionally) ----
  if (err instanceof AppError) {
    const body: ApiResponse = {
      success: false,
      message: err.message,
    };
    if (err.errors) {
      body.errors = err.errors;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // ---- ZodError (should normally be caught by validate middleware) ----
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_';
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    }
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      errors,
    } satisfies ApiResponse);
    return;
  }

  // ---- Prisma errors ----
  if (isPrismaError(err)) {
    const prismaError = mapPrismaError(err);
    res.status(prismaError.statusCode).json({
      success: false,
      message: prismaError.message,
    } satisfies ApiResponse);
    return;
  }

  // ---- Unknown errors ----
  const message = env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err instanceof Error
      ? err.message
      : 'Internal server error';

  const body: ApiResponse = { success: false, message };

  if (env.NODE_ENV !== 'production' && err instanceof Error && err.stack) {
    (body as unknown as Record<string, unknown>).stack = err.stack;
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  } satisfies ApiResponse);
}

// ---------------------------------------------------------------------------
// Prisma error helpers
// ---------------------------------------------------------------------------

interface PrismaErrorLike {
  code?: string;
  meta?: { target?: string[]; field_name?: string };
  message?: string;
}

function isPrismaError(err: unknown): err is PrismaErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    (err as { code: string }).code.startsWith('P')
  );
}

function mapPrismaError(err: PrismaErrorLike): { statusCode: number; message: string } {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = err.meta?.target?.join(', ') ?? 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `A record with this ${target} already exists.`,
      };
    }
    case 'P2025': {
      // Record not found
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found.',
      };
    }
    case 'P2003': {
      // Foreign key constraint violation
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Related record not found.',
      };
    }
    default:
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message ?? 'Database error.',
      };
  }
}
