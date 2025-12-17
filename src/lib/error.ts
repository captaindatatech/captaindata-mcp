/**
 * Error handling utilities
 *
 * This module re-exports error types and utilities from the centralized types module.
 * For new code, import directly from '../../types' instead.
 */

export {
  ErrorResponseSchema,
  ERROR_CODES,
  createErrorResponse,
  jsonErrorResponse as json,
  type ErrorResponse,
  type ErrorCode,
  type ErrorScope,
} from '../types';
