import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants';
import type { PaginationMeta } from '../types';

/**
 * Parse pagination query params (`page`, `limit`) into validated numbers.
 */
export function parsePagination(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const requestedLimit = parseInt(query.limit ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(1, requestedLimit), MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build the pagination metadata object for a response.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}
