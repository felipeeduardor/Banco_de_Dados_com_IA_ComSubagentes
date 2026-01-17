/**
 * PropIA Delta - Backend Server
 * Main entry point for the Express application
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from the correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import routes
import chatRouter from './routes/chat.js';
import dataRouter from './routes/data.js';
import authRouter from './routes/auth.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { optionalAuth } from './middleware/auth.js';

// Import config
import { getConfigStatus, testConnection } from './config/supabase.js';
import { serveSwaggerUI } from './config/swagger.js';

// Import services for status check
import { getAllTables, getDatabaseMode, getQueryStats } from './services/database.js';
import { isOpenAIConfigured } from './services/nlp.js';
import { getAuthMode, isAuthConfigured } from './services/auth.js';

// ============================================
// Configuration
// ============================================
const PORT = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_PREFIX = '/api';

// ============================================
// Initialize Express Application
// ============================================
const app: Application = express();

// ============================================
// Security Middleware
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  })
);

// ============================================
// CORS Configuration
// ============================================
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow all origins
    if (NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // In production, check against allowed origins
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim());

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem nao permitida pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// ============================================
// Request Parsing Middleware
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Logging Middleware
// ============================================
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    skip: (req) => req.url === '/api/health',
  })
);

// ============================================
// Request Timestamp Middleware
// ============================================
app.use((req: Request, _res: Response, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ============================================
// Health Check Endpoint
// ============================================
app.get(`${API_PREFIX}/health`, async (_req: Request, res: Response) => {
  const supabaseStatus = getConfigStatus();
  const dbConnection = await testConnection();
  const queryStats = getQueryStats();
  const dbMode = getDatabaseMode();

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services: {
      database: {
        mode: dbMode,
        configured: supabaseStatus.configured,
        connected: dbMode === 'demo' ? true : dbConnection.connected,
        message: dbMode === 'demo'
          ? 'Operando em modo demo com dados mock. Configure SUPABASE_URL para usar banco real.'
          : dbConnection.message,
        details: supabaseStatus.details,
        stats: {
          totalQueries: queryStats.totalQueries,
          mockQueries: queryStats.mockQueries,
          supabaseQueries: queryStats.supabaseQueries,
          failedQueries: queryStats.failedQueries,
        },
      },
      openai: {
        configured: isOpenAIConfigured(),
        mode: isOpenAIConfigured() ? 'ai' : 'rules',
      },
      auth: {
        configured: isAuthConfigured(),
        mode: getAuthMode(),
      },
      availableTables: getAllTables(),
    },
  };

  res.json(health);
});

// ============================================
// API Status Endpoint
// ============================================
app.get(`${API_PREFIX}/status`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PropIA Delta API esta funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: `${API_PREFIX}/health`,
      auth: {
        register: `${API_PREFIX}/auth/register`,
        login: `${API_PREFIX}/auth/login`,
        logout: `${API_PREFIX}/auth/logout`,
        me: `${API_PREFIX}/auth/me`,
        refresh: `${API_PREFIX}/auth/refresh`,
        status: `${API_PREFIX}/auth/status`,
      },
      chat: `${API_PREFIX}/chat`,
      chatSuggestions: `${API_PREFIX}/chat/suggestions`,
      tables: `${API_PREFIX}/data/tables`,
      schemas: `${API_PREFIX}/data/schemas`,
      tableData: `${API_PREFIX}/data/:tableName`,
      tableSchema: `${API_PREFIX}/data/:tableName/schema`,
      tableStats: `${API_PREFIX}/data/:tableName/stats`,
    },
  });
});

// ============================================
// API Documentation (Swagger)
// ============================================
serveSwaggerUI(app);

// ============================================
// API Routes
// ============================================

// Public routes (authentication)
app.use(`${API_PREFIX}/auth`, authRouter);

// Protected routes (require authentication - optional for now)
app.use(`${API_PREFIX}/chat`, optionalAuth, chatRouter);
app.use(`${API_PREFIX}/data`, optionalAuth, dataRouter);

// ============================================
// Root Endpoint
// ============================================
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'PropIA Delta API',
    version: '1.0.0',
    description: 'API para consultas de dados em linguagem natural',
    documentation: `${API_PREFIX}/status`,
    health: `${API_PREFIX}/health`,
  });
});

// ============================================
// Error Handling
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Graceful Shutdown
// ============================================
function gracefulShutdown(signal: string) {
  console.log(`\n[Server] Recebido ${signal}. Encerrando graciosamente...`);

  // Close server
  server.close(() => {
    console.log('[Server] Conexoes HTTP fechadas.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[Server] Forcando encerramento apos timeout.');
    process.exit(1);
  }, 10000);
}

// ============================================
// Start Server
// ============================================
const server = app.listen(PORT, () => {
  const dbMode = getDatabaseMode();
  const supabaseStatus = getConfigStatus();

  console.log('\n========================================');
  console.log('  PropIA Delta - Backend Server');
  console.log('========================================');
  console.log(`  Ambiente:    ${NODE_ENV}`);
  console.log(`  Porta:       ${PORT}`);
  console.log(`  Health:      http://localhost:${PORT}${API_PREFIX}/health`);
  console.log(`  Status:      http://localhost:${PORT}${API_PREFIX}/status`);
  console.log(`  Docs:        http://localhost:${PORT}${API_PREFIX}/docs`);
  console.log('========================================');

  // Log service status
  console.log(`\n  [Database] Modo: ${dbMode.toUpperCase()}`);
  if (dbMode === 'demo') {
    console.log('  [Database] Usando dados mock para demonstracao');
    console.log('  [Database] Configure SUPABASE_URL e SUPABASE_ANON_KEY para usar banco real');
  } else {
    console.log(`  [Database] URL: ${supabaseStatus.url}`);
  }
  console.log(`  [OpenAI]   Configurado: ${isOpenAIConfigured() ? 'Sim' : 'Nao (usando regras)'}`);
  console.log(`  [Tabelas]  Disponiveis: ${getAllTables().join(', ')}`);
  console.log('\n========================================\n');
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Excecao nao capturada:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Promise rejeitada nao tratada:', promise, 'Motivo:', reason);
});

// ============================================
// Type Extensions
// ============================================
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
    }
  }
}

export default app;
