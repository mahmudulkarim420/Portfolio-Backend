import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';

import { HttpStatus } from '../constants';
import { AppError } from '../types';

/**
 * The request locations that can be validated.
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Convert a ZodError into a flat `{ field: message }` record.
 */
function formatZodError(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_';
    if (!formatted[path]) {
      formatted[path] = issue.message;
    }
  }
  return formatted;
}

/**
 * Create a validation middleware for a given Zod schema and target.
 *
 * On failure responds `422` with `{ success: false, message, errors }`
 * (README §7: `{ "errors": { "<field>": "<message>" } }`).
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req[target];

    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = formatZodError(result.error);
      next(
        new AppError(
          'Validation failed',
          HttpStatus.UNPROCESSABLE_ENTITY,
          errors,
        ),
      );
      return;
    }

    // Replace the target with the parsed (transformed/defaults-applied) data.
    req[target] = result.data;
    next();
  };
}

/**
 * Validate multiple targets at once, e.g. `validateAll({ body: bodySchema, params: paramsSchema })`.
 */
export function validateAll(schemas: Partial<Record<ValidationTarget, ZodSchema>>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const target of Object.keys(schemas) as ValidationTarget[]) {
      const schema = schemas[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);
      if (!result.success) {
        const errors = formatZodError(result.error);
        next(
          new AppError(
            'Validation failed',
            HttpStatus.UNPROCESSABLE_ENTITY,
            errors,
          ),
        );
        return;
      }
      req[target] = result.data;
    }
    next();
  };
}
