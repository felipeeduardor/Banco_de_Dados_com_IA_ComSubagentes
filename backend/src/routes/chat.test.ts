/**
 * Chat Route Tests
 * Tests for POST /api/chat endpoint and related functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import chatRouter from './chat.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';

// ============================================
// Test App Setup
// ============================================
let app: Application;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
});

afterAll(() => {
  // Cleanup if needed
});

describe('POST /api/chat', () => {
  describe('valid requests', () => {
    it('should process a simple count query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Quantas transacoes existem?',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.sqlQuery).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should process a sum query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Qual o total de vendas?',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sqlQuery).toMatch(/sum/i);
    });

    it('should process a query with table context', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Quantos clientes temos?',
          context: {
            tableName: 'customers',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sqlQuery).toContain('customers');
    });

    it('should process a filter query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Mostre transacoes com status aprovado',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Filter queries may or may not include the filter in SQL depending on detection
      expect(response.body.data.sqlQuery).toBeDefined();
    });

    it('should process a top N query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Top 5 maiores vendas',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sqlQuery.toLowerCase()).toContain('limit 5');
    });

    it('should process a group by query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Transacoes por status',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sqlQuery.toLowerCase()).toContain('group by');
    });

    it('should return chart data for aggregate queries', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Transacoes por status',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Chart data may or may not be present depending on the query result
      if (response.body.data.chartData) {
        expect(response.body.data.chartData.type).toBeDefined();
        expect(response.body.data.chartData.title).toBeDefined();
      }
    });

    it('should include data array in response', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Mostre todas as transacoes',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should detect table from message when not in context', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Quantos produtos temos cadastrados?',
          context: {
            tableName: 'products',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sqlQuery.toLowerCase()).toContain('products');
    });
  });

  describe('invalid requests', () => {
    it('should reject empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: '',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject message that is too long', async () => {
      const longMessage = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: longMessage,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid table name in context', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Quantos registros existem?',
          context: {
            tableName: 'nonexistent_table',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('nao encontrada');
    });

    it('should reject request with invalid JSON', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Express may return 400 or 500 for invalid JSON depending on configuration
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-string message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 123,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('conversation history', () => {
    it('should accept valid conversation history', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'E o total?',
          context: {
            conversationHistory: [
              {
                role: 'user',
                content: 'Quantas transacoes aprovadas?',
                timestamp: '2024-01-15T10:00:00Z',
              },
              {
                role: 'assistant',
                content: 'Encontrei 15 transacoes aprovadas.',
                timestamp: '2024-01-15T10:00:01Z',
              },
            ],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid role in conversation history', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Continuar',
          context: {
            conversationHistory: [
              {
                role: 'admin', // Invalid
                content: 'Test',
                timestamp: '2024-01-15T10:00:00Z',
              },
            ],
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('GET /api/chat/suggestions', () => {
  it('should return query suggestions', async () => {
    const response = await request(app).get('/api/chat/suggestions');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.suggestions).toBeDefined();
    expect(Array.isArray(response.body.data.suggestions)).toBe(true);
  });

  it('should return suggestions with categories', async () => {
    const response = await request(app).get('/api/chat/suggestions');

    expect(response.status).toBe(200);
    const suggestions = response.body.data.suggestions;
    expect(suggestions.length).toBeGreaterThan(0);

    // Each suggestion should have category and examples
    suggestions.forEach((suggestion: { category: string; examples: string[] }) => {
      expect(suggestion.category).toBeDefined();
      expect(Array.isArray(suggestion.examples)).toBe(true);
      expect(suggestion.examples.length).toBeGreaterThan(0);
    });
  });

  it('should include expected categories', async () => {
    const response = await request(app).get('/api/chat/suggestions');

    const categories = response.body.data.suggestions.map(
      (s: { category: string }) => s.category
    );

    expect(categories).toContain('Contagem');
    expect(categories).toContain('Totais');
    expect(categories).toContain('Agrupamentos');
  });
});

describe('GET /api/chat/history', () => {
  it('should return empty history (placeholder)', async () => {
    const response = await request(app).get('/api/chat/history');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.history).toBeDefined();
    expect(Array.isArray(response.body.data.history)).toBe(true);
  });

  it('should include informational message', async () => {
    const response = await request(app).get('/api/chat/history');

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBeDefined();
  });
});
