/**
 * Authentication Middleware
 * Protects routes by requiring valid authentication tokens
 */

import { Request, Response, NextFunction } from 'express';
import { Errors, asyncHandler } from './errorHandler.js';
import { getUser, verifyToken } from '../services/auth.js';
import type { AuthUser } from '../types/index.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      accessToken?: string;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to require authentication
 * Verifies the access token and attaches user to request
 */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
      throw Errors.unauthorized('Token de autenticacao nao fornecido');
    }

    // Verify token and get user
    const result = await getUser(token);

    if (result.error || !result.user) {
      throw Errors.unauthorized(result.error || 'Token invalido ou expirado');
    }

    // Attach user and token to request
    req.user = result.user;
    req.accessToken = token;

    next();
  }
);

/**
 * Middleware to optionally authenticate
 * If token is provided, validates and attaches user
 * If no token, continues without user
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (token) {
      const result = await getUser(token);

      if (result.user) {
        req.user = result.user;
        req.accessToken = token;
      }
    }

    next();
  }
);

/**
 * Middleware to check if user owns the resource
 * Requires requireAuth to be called first
 */
export function requireOwnership(
  getUserIdFromRequest: (req: Request) => string | undefined
) {
  return asyncHandler(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw Errors.unauthorized('Autenticacao necessaria');
      }

      const resourceUserId = getUserIdFromRequest(req);

      if (!resourceUserId) {
        throw Errors.badRequest('ID do recurso nao fornecido');
      }

      if (req.user.id !== resourceUserId) {
        throw Errors.forbidden('Voce nao tem permissao para acessar este recurso');
      }

      next();
    }
  );
}

/**
 * Check if request is authenticated (for conditional logic)
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}

/**
 * Get current user from request (or null if not authenticated)
 */
export function getCurrentUser(req: Request): AuthUser | null {
  return req.user || null;
}

export default {
  requireAuth,
  optionalAuth,
  requireOwnership,
  isAuthenticated,
  getCurrentUser,
};
