import type { Response } from 'express';

import { HttpStatus } from '../constants';
import type { ApiResponse, PaginationMeta } from '../types';

/**
 * Consistent API response helpers.
 *
 * Every controller returns one of these so the response envelope is uniform:
 * `{ success, message?, data?, errors?, meta? }`.
 */
export class ApiResponseHelper {
  /**
   * Send a success response (200 by default).
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = HttpStatus.OK,
  ): Response {
    const body: ApiResponse<T> = { success: true, data };
    if (message) {
      body.message = message;
    }
    return res.status(statusCode).json(body);
  }

  /**
   * Send a success response with pagination metadata.
   */
  static successWithPagination<T>(
    res: Response,
    data: T,
    meta: PaginationMeta,
    message?: string,
  ): Response {
    const body: ApiResponse<T> = { success: true, data, meta };
    if (message) {
      body.message = message;
    }
    return res.status(HttpStatus.OK).json(body);
  }

  /**
   * Send a created response (201).
   */
  static created<T>(res: Response, data: T, message?: string): Response {
    const body: ApiResponse<T> = { success: true, data };
    if (message) {
      body.message = message;
    }
    return res.status(HttpStatus.CREATED).json(body);
  }

  /**
   * Send a no-content response (204).
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Send an error response.
   */
  static error(
    res: Response,
    statusCode: number,
    message: string,
    errors?: Record<string, string>,
  ): Response {
    const body: ApiResponse = { success: false, message };
    if (errors) {
      body.errors = errors;
    }
    return res.status(statusCode).json(body);
  }
}

export const apiResponse = ApiResponseHelper;
