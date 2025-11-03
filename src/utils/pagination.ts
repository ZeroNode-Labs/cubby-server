/**
 * Pagination utilities for API responses
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  maxLimit?: number;
}

/**
 * Parse and validate pagination parameters from query
 */
export function parsePaginationParams(
  query: any,
  defaults = { page: 1, limit: 20, maxLimit: 100 }
): PaginationOptions {
  const page = Math.max(1, parseInt(query.page) || defaults.page);
  const limit = Math.min(
    defaults.maxLimit,
    Math.max(1, parseInt(query.limit) || defaults.limit)
  );

  return { page, limit, maxLimit: defaults.maxLimit };
}

/**
 * Calculate Prisma skip/take from page/limit
 */
export function getPrismaOffsetLimit(options: PaginationOptions) {
  return {
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / options.limit);

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
}

/**
 * Pagination schema for Fastify
 */
export const paginationQuerySchema = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
};

export const paginationResponseSchema = {
  type: "object",
  properties: {
    page: { type: "integer" },
    limit: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
    hasNext: { type: "boolean" },
    hasPrev: { type: "boolean" },
  },
};
