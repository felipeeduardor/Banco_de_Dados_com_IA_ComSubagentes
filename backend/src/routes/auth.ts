/**
 * Authentication Routes
 * Handles user registration, login, logout, and session management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, handleZodError, Errors } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  signUp,
  signIn,
  signOut,
  getUser,
  refreshSession,
  getAuthMode,
} from '../services/auth.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();

// ============================================
// Request Validation Schemas
// ============================================

const RegisterSchema = z.object({
  email: z
    .string()
    .email('Email invalido')
    .min(1, 'Email e obrigatorio'),
  password: z
    .string()
    .min(6, 'Senha deve ter no minimo 6 caracteres')
    .max(100, 'Senha muito longa'),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z
    .string()
    .email('Email invalido')
    .min(1, 'Email e obrigatorio'),
  password: z
    .string()
    .min(1, 'Senha e obrigatoria'),
});

const RefreshSchema = z.object({
  refresh_token: z
    .string()
    .min(1, 'Refresh token e obrigatorio'),
});

// ============================================
// POST /api/auth/register - Create New User
// ============================================
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw handleZodError(parseResult.error);
    }

    const { email, password, name } = parseResult.data;

    // Register user
    const result = await signUp({ email, password, name });

    if (result.error) {
      throw Errors.badRequest(result.error);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        session: result.session,
        message: 'Usuario registrado com sucesso',
      },
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  })
);

// ============================================
// POST /api/auth/login - Authenticate User
// ============================================
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw handleZodError(parseResult.error);
    }

    const { email, password } = parseResult.data;

    // Authenticate user
    const result = await signIn({ email, password });

    if (result.error || !result.session) {
      throw Errors.unauthorized(result.error || 'Falha na autenticacao');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        session: result.session,
        message: 'Login realizado com sucesso',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

// ============================================
// POST /api/auth/logout - Sign Out User
// ============================================
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const accessToken = req.accessToken!;

    const result = await signOut(accessToken);

    if (result.error) {
      throw Errors.internal(result.error);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Logout realizado com sucesso',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

// ============================================
// GET /api/auth/me - Get Current User
// ============================================
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        user: req.user,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

// ============================================
// POST /api/auth/refresh - Refresh Session
// ============================================
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const parseResult = RefreshSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw handleZodError(parseResult.error);
    }

    const { refresh_token } = parseResult.data;

    // Refresh session
    const result = await refreshSession(refresh_token);

    if (result.error || !result.session) {
      throw Errors.unauthorized(result.error || 'Falha ao renovar sessao');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        session: result.session,
        message: 'Sessao renovada com sucesso',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

// ============================================
// GET /api/auth/status - Auth Service Status
// ============================================
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    const mode = getAuthMode();

    const response: ApiResponse = {
      success: true,
      data: {
        mode,
        configured: true,
        message: mode === 'demo'
          ? 'Autenticacao em modo DEMO. Usuario de teste: demo@example.com / demo123'
          : 'Autenticacao conectada ao Supabase Auth',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
