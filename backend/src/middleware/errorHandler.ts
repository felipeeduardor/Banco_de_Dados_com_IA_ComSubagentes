/**
 * Error Handling Middleware
 * Centralized error handling for the Express application
 */

import { Request, Response, NextFunction } from 'express';
import type { ApiError, ApiResponse } from '../types/index.js';

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory methods
 */
export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new AppError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Nao autorizado') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Acesso negado') =>
    new AppError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Recurso') =>
    new AppError(`${resource} nao encontrado`, 404, 'NOT_FOUND'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  validationError: (message: string, details?: Record<string, unknown>) =>
    new AppError(message, 422, 'VALIDATION_ERROR', details),

  tooManyRequests: (message: string = 'Muitas requisicoes. Tente novamente mais tarde.') =>
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),

  internal: (message: string = 'Erro interno do servidor') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message: string = 'Servico temporariamente indisponivel') =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),

  databaseError: (message: string) =>
    new AppError(message, 500, 'DATABASE_ERROR'),

  nlpError: (message: string) =>
    new AppError(message, 500, 'NLP_ERROR'),

  queryError: (message: string, details?: Record<string, unknown>) =>
    new AppError(message, 400, 'QUERY_ERROR', details),
};

/**
 * Format error for API response
 */
function formatError(error: Error | AppError): ApiError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
  }

  // Generic error
  return {
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno. Tente novamente mais tarde.'
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };
}

/**
 * Log error with context
 */
function logError(error: Error | AppError, req: Request): void {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      }),
    },
  };

  if (error instanceof AppError && error.isOperational) {
    console.warn('[AppError]', JSON.stringify(logData, null, 2));
  } else {
    console.error('[UnexpectedError]', JSON.stringify(logData, null, 2));
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logError(error, req);

  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Build response
  const response: ApiResponse = {
    success: false,
    error: formatError(error),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(Errors.notFound(`Rota ${req.method} ${req.path}`));
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler for Zod
 */
export function handleZodError(zodError: { issues: Array<{ path: (string | number)[]; message: string }> }): AppError {
  const details = zodError.issues.reduce<Record<string, string>>((acc, issue) => {
    const path = issue.path.join('.');
    acc[path] = issue.message;
    return acc;
  }, {});

  return Errors.validationError('Dados de entrada invalidos', details);
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleZodError,
  AppError,
  Errors,
};
