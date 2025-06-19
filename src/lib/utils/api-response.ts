import { NextResponse } from 'next/server';
import type { 
  ApiResponse, 
  ApiSuccess, 
  ApiError, 
  PaginatedResponse, 
  PaginationMeta 
} from '@/lib/types/api';

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T, 
  message?: string,
  status: number = 200
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string, 
  statusCode: number = 500, 
  details?: any
): Response {
  const response: ApiError = {
    success: false,
    error,
    ...(details && { details }),
    ...(statusCode !== 500 && { statusCode })
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Creates a paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  status: number = 200
): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
    ...(message && { message })
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page?: number, limit?: number) {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(100, Math.max(1, limit || 20));
  
  return { page: validatedPage, limit: validatedLimit };
}

/**
 * Common response messages
 */
export const RESPONSE_MESSAGES = {
  // Success messages
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  VALIDATED: 'Validation successful',
  
  // Error messages
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_REQUEST: 'Invalid request',
  INTERNAL_ERROR: 'Internal server error',
  
  // Specific errors
  INVALID_PROVIDER: 'Invalid provider specified',
  INVALID_API_KEY: 'Invalid API key',
  API_KEY_REQUIRED: 'API key is required',
  PROVIDER_NOT_CONFIGURED: 'Provider not configured',
  FILE_TOO_LARGE: 'File size exceeds limit',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  CHAT_NOT_FOUND: 'Chat not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  USER_NOT_FOUND: 'User not found',
  
  // Authentication
  SESSION_EXPIRED: 'Session expired',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_REQUIRED: 'Token is required',
} as const;

/**
 * Quick response helpers
 */
export const responses = {
  // Success responses
  ok: <T>(data: T, message?: string) => successResponse(data, message, 200),
  created: <T>(data: T, message?: string) => successResponse(data, message || RESPONSE_MESSAGES.CREATED, 201),
  updated: <T>(data: T, message?: string) => successResponse(data, message || RESPONSE_MESSAGES.UPDATED, 200),
  deleted: (message?: string) => successResponse(null, message || RESPONSE_MESSAGES.DELETED, 200),
  
  // Error responses
  badRequest: (error?: string, details?: any) => errorResponse(error || RESPONSE_MESSAGES.INVALID_REQUEST, 400, details),
  unauthorized: (error?: string) => errorResponse(error || RESPONSE_MESSAGES.UNAUTHORIZED, 401),
  forbidden: (error?: string) => errorResponse(error || RESPONSE_MESSAGES.FORBIDDEN, 403),
  notFound: (error?: string) => errorResponse(error || RESPONSE_MESSAGES.NOT_FOUND, 404),
  conflict: (error: string, details?: any) => errorResponse(error, 409, details),
  validationError: (error?: string, details?: any) => errorResponse(error || RESPONSE_MESSAGES.VALIDATION_FAILED, 400, details),
  internalError: (error?: string) => errorResponse(error || RESPONSE_MESSAGES.INTERNAL_ERROR, 500),
  
  // Specific errors
  invalidProvider: () => errorResponse(RESPONSE_MESSAGES.INVALID_PROVIDER, 400),
  invalidApiKey: () => errorResponse(RESPONSE_MESSAGES.INVALID_API_KEY, 400),
  providerNotConfigured: () => errorResponse(RESPONSE_MESSAGES.PROVIDER_NOT_CONFIGURED, 400),
  fileTooLarge: () => errorResponse(RESPONSE_MESSAGES.FILE_TOO_LARGE, 413),
  unsupportedFileType: () => errorResponse(RESPONSE_MESSAGES.UNSUPPORTED_FILE_TYPE, 415),
  
  // Paginated response
  paginated: <T>(data: T[], pagination: PaginationMeta, message?: string) => 
    paginatedResponse(data, pagination, message),
};

/**
 * Converts thrown exceptions to appropriate API responses
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not found')) {
      return responses.notFound(error.message);
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return responses.unauthorized(error.message);
    }
    
    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return responses.validationError(error.message);
    }
    
    if (error.message.includes('API key')) {
      return responses.invalidApiKey();
    }
    
    // Return the error message for other known errors
    return responses.internalError(error.message);
  }
  
  // Generic error response
  return responses.internalError();
}