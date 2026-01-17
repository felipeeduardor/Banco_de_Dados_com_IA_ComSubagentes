/**
 * App Tests
 * Tests for main application endpoints (health, status, root)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import chatRouter from '../routes/chat.js';
import dataRouter from '../routes/data.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { getConfigStatus, testConnection } from '../config/supabase.js';
import { getAllTables } from '../services/database.js';
import { isOpenAIConfigured } from '../services/nlp.js';

// ============================================
// Test App Setup (mirrors the main app structure)
// ============================================
let app: Application;

beforeAll(() => {
  app = express();
  app.use(cors());
  app.use(express.json());

  const API_PREFIX = '/api';

  // Health Check
  app.get(`${API_PREFIX}/health`, async (_req: Request, res: Response) => {
    const supabaseStatus = getConfigStatus();
    const dbConnection = await testConnection();

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        database: {
          mode: supabaseStatus.mode,
          configured: supabaseStatus.configured,
          connected: dbConnection.connected,
          message: dbConnection.message,
        },
        openai: {
          configured: isOpenAIConfigured(),
          mode: isOpenAIConfigured() ? 'ai' : 'rules',
        },
        availableTables: getAllTables(),
      },
    };

    res.json(health);
  });

  // Status
  app.get(`${API_PREFIX}/status`, (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'AI Data Assistant API esta funcionando!',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: `${API_PREFIX}/health`,
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

  // Root
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'AI Data Assistant API',
      version: '1.0.0',
      description: 'API para consultas de dados em linguagem natural',
      documentation: `${API_PREFIX}/status`,
      health: `${API_PREFIX}/health`,
    });
  });

  // Routes
  app.use(`${API_PREFIX}/chat`, chatRouter);
  app.use(`${API_PREFIX}/data`, dataRouter);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);
});

afterAll(() => {
  // Cleanup
});

describe('GET /', () => {
  it('should return API information', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('AI Data Assistant API');
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.description).toBeDefined();
  });

  it('should include links to documentation and health', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.documentation).toBeDefined();
    expect(response.body.health).toBeDefined();
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should include environment information', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.environment).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
  });

  it('should include database service status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.services.database).toBeDefined();
    expect(response.body.services.database.mode).toBeDefined();
    expect(typeof response.body.services.database.configured).toBe('boolean');
    expect(typeof response.body.services.database.connected).toBe('boolean');
    expect(response.body.services.database.message).toBeDefined();
  });

  it('should include OpenAI service status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.services.openai).toBeDefined();
    expect(typeof response.body.services.openai.configured).toBe('boolean');
    expect(response.body.services.openai.mode).toBeDefined();
  });

  it('should include available tables', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.services.availableTables)).toBe(true);
    expect(response.body.services.availableTables.length).toBeGreaterThan(0);
  });

  it('should show database mode', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    // Mode can be 'mock' or 'demo' depending on configuration
    expect(['mock', 'demo', 'production']).toContain(response.body.services.database.mode);
    expect(typeof response.body.services.database.configured).toBe('boolean');
  });

  it('should show OpenAI mode', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    // Mode can be 'rules' or 'ai' depending on configuration
    expect(['rules', 'ai']).toContain(response.body.services.openai.mode);
    expect(typeof response.body.services.openai.configured).toBe('boolean');
  });
});

describe('GET /api/status', () => {
  it('should return API status', async () => {
    const response = await request(app).get('/api/status');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  it('should list available endpoints', async () => {
    const response = await request(app).get('/api/status');

    expect(response.status).toBe(200);
    expect(response.body.endpoints).toBeDefined();
    expect(response.body.endpoints.health).toBeDefined();
    expect(response.body.endpoints.chat).toBeDefined();
    expect(response.body.endpoints.tables).toBeDefined();
  });

  it('should include all documented endpoints', async () => {
    const response = await request(app).get('/api/status');

    const endpoints = response.body.endpoints;
    expect(endpoints.health).toContain('/health');
    expect(endpoints.chat).toContain('/chat');
    expect(endpoints.chatSuggestions).toContain('/suggestions');
    expect(endpoints.tables).toContain('/tables');
    expect(endpoints.schemas).toContain('/schemas');
  });
});

describe('404 Not Found Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should include route information in error message', async () => {
    const response = await request(app).get('/api/some/unknown/path');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain('/api/some/unknown/path');
  });

  it('should return 404 for unknown POST routes', async () => {
    const response = await request(app).post('/api/unknown').send({});

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe('Error Response Format', () => {
  it('should include standard error fields', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  });

  it('should include timestamp in ISO format', async () => {
    const response = await request(app).get('/api/unknown');

    const timestamp = response.body.timestamp;
    expect(() => new Date(timestamp)).not.toThrow();
  });
});

describe('CORS', () => {
  it('should include CORS headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should allow OPTIONS requests', async () => {
    const response = await request(app)
      .options('/api/chat')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
  });
});

describe('Content-Type handling', () => {
  it('should accept application/json', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Content-Type', 'application/json')
      .send({ message: 'test' });

    expect(response.status).not.toBe(415);
  });

  it('should return JSON responses', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['content-type']).toContain('application/json');
  });
});
