/**
 * Pagination Utilities
 * Provides consistent pagination helpers for all list endpoints
 */

import logger from './logger.js';

/**
 * Default pagination configuration
 */
const PAGINATION_DEFAULTS = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultOffset: 0
};

/**
 * Parse and validate pagination parameters from request query
 * @param {Object} query - Express request query object
 * @param {Object} options - Custom pagination options
 * @returns {Object} Validated pagination parameters
 */
function parsePaginationParams(query, options = {}) {
  const {
    defaultLimit = PAGINATION_DEFAULTS.defaultLimit,
    maxLimit = PAGINATION_DEFAULTS.maxLimit,
    defaultOffset = PAGINATION_DEFAULTS.defaultOffset
  } = options;

  let limit = parseInt(query.limit) || defaultLimit;
  let offset = parseInt(query.offset) || defaultOffset;

  // Validate and constrain limit
  if (limit < 1) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    logger.warn(`Limit ${limit} exceeds max ${maxLimit}, using max`);
    limit = maxLimit;
  }

  // Validate offset
  if (offset < 0) {
    offset = defaultOffset;
  }

  return { limit, offset };
}

/**
 * Parse page-based pagination (alternative to offset-based)
 * @param {Object} query - Express request query object
 * @param {Object} options - Custom pagination options
 * @returns {Object} Pagination parameters with limit and offset
 */
function parsePageParams(query, options = {}) {
  const {
    defaultLimit = PAGINATION_DEFAULTS.defaultLimit,
    maxLimit = PAGINATION_DEFAULTS.maxLimit
  } = options;

  let limit = parseInt(query.limit) || parseInt(query.per_page) || defaultLimit;
  let page = parseInt(query.page) || 1;

  // Validate and constrain limit
  if (limit < 1) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  // Validate page
  if (page < 1) {
    page = 1;
  }

  // Calculate offset from page
  const offset = (page - 1) * limit;

  return { limit, offset, page };
}

/**
 * Build pagination metadata for response
 * @param {number} total - Total count of items
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @returns {Object} Pagination metadata
 */
function buildPaginationMeta(total, limit, offset) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasMore = offset + limit < total;
  const hasPrevious = offset > 0;

  return {
    total,
    limit,
    offset,
    currentPage,
    totalPages,
    hasMore,
    hasPrevious,
    nextOffset: hasMore ? offset + limit : null,
    previousOffset: hasPrevious ? Math.max(0, offset - limit) : null
  };
}

/**
 * Apply pagination to Supabase query
 * @param {Object} query - Supabase query builder
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @returns {Object} Query with pagination applied
 */
function applyPagination(query, limit, offset) {
  return query.range(offset, offset + limit - 1);
}

/**
 * Build paginated response
 * @param {Array} data - Array of items
 * @param {number} total - Total count (optional, defaults to data.length)
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @returns {Object} Paginated response object
 */
function buildPaginatedResponse(data, total, limit, offset) {
  const actualTotal = total !== undefined ? total : data.length;
  
  return {
    data: data || [],
    pagination: buildPaginationMeta(actualTotal, limit, offset)
  };
}

/**
 * Middleware to add pagination helpers to request object
 * @param {Object} options - Pagination options
 * @returns {Function} Express middleware
 */
function paginationMiddleware(options = {}) {
  return (req, res, next) => {
    // Add pagination helper to request
    req.pagination = parsePaginationParams(req.query, options);
    
    // Add helper method to build response
    res.paginate = (data, total) => {
      return res.json(
        buildPaginatedResponse(data, total, req.pagination.limit, req.pagination.offset)
      );
    };
    
    next();
  };
}

/**
 * Execute a paginated Supabase query
 * @param {Object} query - Supabase query builder
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Paginated result
 */
async function executePaginatedQuery(query, limit, offset, options = {}) {
  const { count = 'exact' } = options;

  try {
    // Apply pagination
    const paginatedQuery = applyPagination(query, limit, offset);

    // Execute query with count
    const { data, error, count: total } = await paginatedQuery;

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data || [],
      pagination: buildPaginationMeta(total || 0, limit, offset)
    };
  } catch (error) {
    logger.error('Paginated query failed:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      pagination: buildPaginationMeta(0, limit, offset)
    };
  }
}

/**
 * Cursor-based pagination helper (for large datasets)
 * @param {Object} query - Supabase query builder
 * @param {string} cursorField - Field to use for cursor (e.g., 'created_at', 'id')
 * @param {string} cursor - Cursor value from previous page
 * @param {number} limit - Items per page
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Object} Query with cursor pagination applied
 */
function applyCursorPagination(query, cursorField, cursor, limit, direction = 'desc') {
  let paginatedQuery = query.limit(limit + 1); // Fetch one extra to check if there's more

  if (cursor) {
    if (direction === 'desc') {
      paginatedQuery = paginatedQuery.lt(cursorField, cursor);
    } else {
      paginatedQuery = paginatedQuery.gt(cursorField, cursor);
    }
  }

  paginatedQuery = paginatedQuery.order(cursorField, { ascending: direction === 'asc' });

  return paginatedQuery;
}

/**
 * Build cursor-based pagination response
 * @param {Array} data - Array of items (includes extra item for hasMore check)
 * @param {string} cursorField - Field used for cursor
 * @param {number} limit - Items per page
 * @returns {Object} Cursor paginated response
 */
function buildCursorResponse(data, cursorField, limit) {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1][cursorField] : null;

  return {
    data: items,
    pagination: {
      hasMore,
      nextCursor,
      limit
    }
  };
}

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - 'asc' or 'desc'
 * @param {Array} allowedFields - Allowed fields for sorting
 * @returns {Object} Validated sort parameters
 */
function validateSortParams(sortBy, sortOrder, allowedFields = []) {
  const validatedSortBy = allowedFields.includes(sortBy) ? sortBy : allowedFields[0] || 'created_at';
  const validatedSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase()) 
    ? sortOrder.toLowerCase() 
    : 'desc';

  return {
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder
  };
}

export {
  // Constants
  PAGINATION_DEFAULTS,

  // Offset-based pagination
  parsePaginationParams,
  parsePageParams,
  buildPaginationMeta,
  applyPagination,
  buildPaginatedResponse,
  executePaginatedQuery,
  paginationMiddleware,

  // Cursor-based pagination
  applyCursorPagination,
  buildCursorResponse,

  // Utilities
  validateSortParams
};

