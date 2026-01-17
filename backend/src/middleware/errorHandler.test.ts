/**
 * Error Handler Tests
 * Tests for error handling middleware and utilities
 */

import { describe, it, expect } from 'vitest';
import { Request, Response } from 'express';
import {
  AppError,
  Errors,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleZodError,
} from './errorHandler.js';

// ============================================
// Mock Request/Response
// ============================================
function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/test',
    query: {},
    body: {},
    ...overrides,
  } as Request;
}

function mockResponse(): Response & { jsonData: unknown; statusCode: number } {
  const res = {
    statusCode: 200,
    jsonData: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
  };
  return res as Response & { jsonData: unknown; statusCode: number };
}

describe('AppError', () => {
  it('should create error with default values', () => {
    const error = new AppError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
  });

  it('should create error with custom values', () => {
    const error = new AppError('Custom error', 400, 'CUSTOM_CODE', { field: 'value' });

    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.details).toEqual({ field: 'value' });
  });

  it('should have proper stack trace', () => {
    const error = new AppError('Test error');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  it('should be instanceof Error', () => {
    const error = new AppError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('Errors factory', () => {
  describe('badRequest', () => {
    it('should create 400 error', () => {
      const error = Errors.badRequest('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
    });

    it('should accept details', () => {
      const error = Errors.badRequest('Invalid input', { field: 'name' });

      expect(error.details).toEqual({ field: 'name' });
    });
  });

  describe('unauthorized', () => {
    it('should create 401 error', () => {
      const error = Errors.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Nao autorizado');
    });

    it('should accept custom message', () => {
      const error = Errors.unauthorized('Token expired');

      expect(error.message).toBe('Token expired');
    });
  });

  describe('forbidden', () => {
    it('should create 403 error', () => {
      const error = Errors.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Acesso negado');
    });
  });

  describe('notFound', () => {
    it('should create 404 error', () => {
      const error = Errors.notFound('User');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User nao encontrado');
    });

    it('should use default resource name', () => {
      const error = Errors.notFound();

      expect(error.message).toBe('Recurso nao encontrado');
    });
  });

  describe('conflict', () => {
    it('should create 409 error', () => {
      const error = Errors.conflict('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Resource already exists');
    });
  });

  describe('validationError', () => {
    it('should create 422 error', () => {
      const error = Errors.validationError('Invalid data', { email: 'Invalid format' });

      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid data');
      expect(error.details).toEqual({ email: 'Invalid format' });
    });
  });

  describe('tooManyRequests', () => {
    it('should create 429 error', () => {
      const error = Errors.tooManyRequests();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('internal', () => {
    it('should create 500 error', () => {
      const error = Errors.internal();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Erro interno do servidor');
    });
  });

  describe('serviceUnavailable', () => {
    it('should create 503 error', () => {
      const error = Errors.serviceUnavailable();

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('databaseError', () => {
    it('should create database error', () => {
      const error = Errors.databaseError('Connection failed');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.message).toBe('Connection failed');
    });
  });

  describe('nlpError', () => {
    it('should create NLP error', () => {
      const error = Errors.nlpError('Failed to parse query');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('NLP_ERROR');
      expect(error.message).toBe('Failed to parse query');
    });
  });

  describe('queryError', () => {
    it('should create query error', () => {
      const error = Errors.queryError('Invalid SQL', { sql: 'SELECT *' });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('QUERY_ERROR');
      expect(error.details).toEqual({ sql: 'SELECT *' });
    });
  });
});

describe('errorHandler middleware', () => {
  it('should handle AppError', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = Errors.badRequest('Test error');

    errorHandler(error, req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect((res.jsonData as Record<string, unknown>).success).toBe(false);
    expect(((res.jsonData as Record<string, unknown>).error as Record<string, unknown>).code).toBe('BAD_REQUEST');
  });

  it('should handle generic Error', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error('Generic error');

    errorHandler(error, req, res, () => {});

    expect(res.statusCode).toBe(500);
    expect((res.jsonData as Record<string, unknown>).success).toBe(false);
    expect(((res.jsonData as Record<string, unknown>).error as Record<string, unknown>).code).toBe('INTERNAL_ERROR');
  });

  it('should include timestamp in response', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error('Test');

    errorHandler(error, req, res, () => {});

    expect((res.jsonData as Record<string, unknown>).timestamp).toBeDefined();
  });

  it('should format error correctly', () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = Errors.validationError('Invalid data', { field: 'error' });

    errorHandler(error, req, res, () => {});

    const errorResponse = (res.jsonData as Record<string, unknown>).error as Record<string, unknown>;
    expect(errorResponse.code).toBe('VALIDATION_ERROR');
    expect(errorResponse.message).toBe('Invalid data');
    expect(errorResponse.details).toEqual({ field: 'error' });
  });
});

describe('notFoundHandler middleware', () => {
  it('should call next with not found error', () => {
    const req = mockRequest({ method: 'GET', path: '/unknown' });
    const res = mockResponse();
    let capturedError: Error | undefined;

    notFoundHandler(req, res, (err) => {
      capturedError = err as Error;
    });

    expect(capturedError).toBeInstanceOf(AppError);
    expect((capturedError as AppError).statusCode).toBe(404);
    expect((capturedError as AppError).message).toContain('/unknown');
  });

  it('should include HTTP method in message', () => {
    const req = mockRequest({ method: 'POST', path: '/api/test' });
    const res = mockResponse();
    let capturedError: Error | undefined;

    notFoundHandler(req, res, (err) => {
      capturedError = err as Error;
    });

    expect((capturedError as AppError).message).toContain('POST');
  });
});

describe('asyncHandler', () => {
  it('should pass successful result through', async () => {
    const handler = asyncHandler(async (_req, res) => {
      res.json({ success: true });
    });

    const req = mockRequest();
    const res = mockResponse();

    await handler(req, res, () => {});

    expect((res.jsonData as Record<string, unknown>).success).toBe(true);
  });

  it('should catch and pass errors to next', async () => {
    const testError = new Error('Async error');
    const handler = asyncHandler(async () => {
      throw testError;
    });

    const req = mockRequest();
    const res = mockResponse();
    let capturedError: Error | undefined;

    await handler(req, res, (err) => {
      capturedError = err as Error;
    });

    expect(capturedError).toBe(testError);
  });

  it('should work with AppError', async () => {
    const handler = asyncHandler(async () => {
      throw Errors.badRequest('Test');
    });

    const req = mockRequest();
    const res = mockResponse();
    let capturedError: Error | undefined;

    await handler(req, res, (err) => {
      capturedError = err as Error;
    });

    expect(capturedError).toBeInstanceOf(AppError);
    expect((capturedError as AppError).statusCode).toBe(400);
  });
});

describe('handleZodError', () => {
  it('should convert Zod error to AppError', () => {
    const zodError = {
      issues: [
        { path: ['email'], message: 'Invalid email format' },
        { path: ['name'], message: 'Name is required' },
      ],
    };

    const error = handleZodError(zodError);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should include field errors in details', () => {
    const zodError = {
      issues: [
        { path: ['email'], message: 'Invalid email format' },
        { path: ['password'], message: 'Too short' },
      ],
    };

    const error = handleZodError(zodError);

    expect(error.details).toEqual({
      email: 'Invalid email format',
      password: 'Too short',
    });
  });

  it('should handle nested paths', () => {
    const zodError = {
      issues: [
        { path: ['user', 'profile', 'name'], message: 'Required' },
      ],
    };

    const error = handleZodError(zodError);

    expect(error.details).toEqual({
      'user.profile.name': 'Required',
    });
  });

  it('should handle array index paths', () => {
    const zodError = {
      issues: [
        { path: ['items', 0, 'quantity'], message: 'Must be positive' },
      ],
    };

    const error = handleZodError(zodError);

    expect(error.details).toEqual({
      'items.0.quantity': 'Must be positive',
    });
  });

  it('should have standard validation error message', () => {
    const zodError = {
      issues: [
        { path: ['field'], message: 'Error' },
      ],
    };

    const error = handleZodError(zodError);

    expect(error.message).toBe('Dados de entrada invalidos');
  });
});
