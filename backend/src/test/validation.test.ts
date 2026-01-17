/**
 * Validation Schema Tests
 * Tests for Zod schemas used in API endpoints
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================
// Chat Request Schema (copied from chat.ts for testing)
// ============================================
const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem nao pode ser vazia')
    .max(1000, 'Mensagem muito longa (maximo 1000 caracteres)'),
  context: z
    .object({
      tableName: z.string().optional(),
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
            timestamp: z.coerce.date(),
          })
        )
        .optional(),
    })
    .optional(),
});

// ============================================
// Query Params Schema (copied from data.ts for testing)
// ============================================
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  orderBy: z.string().optional(),
  order: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('ASC'),
  status: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
});

describe('ChatRequestSchema', () => {
  describe('message field', () => {
    it('should accept valid message', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Quantas transacoes foram realizadas?',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Quantas transacoes foram realizadas?');
      }
    });

    it('should reject empty message', () => {
      const result = ChatRequestSchema.safeParse({
        message: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mensagem nao pode ser vazia');
      }
    });

    it('should reject message longer than 1000 characters', () => {
      const longMessage = 'a'.repeat(1001);
      const result = ChatRequestSchema.safeParse({
        message: longMessage,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mensagem muito longa (maximo 1000 caracteres)');
      }
    });

    it('should accept message with exactly 1000 characters', () => {
      const maxMessage = 'a'.repeat(1000);
      const result = ChatRequestSchema.safeParse({
        message: maxMessage,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-string message', () => {
      const result = ChatRequestSchema.safeParse({
        message: 123,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const result = ChatRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('context field', () => {
    it('should accept message without context', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Test message',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toBeUndefined();
      }
    });

    it('should accept context with tableName', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Test message',
        context: {
          tableName: 'transactions',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context?.tableName).toBe('transactions');
      }
    });

    it('should accept context with conversationHistory', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Test message',
        context: {
          conversationHistory: [
            {
              role: 'user',
              content: 'Previous question',
              timestamp: '2024-01-15T10:00:00Z',
            },
            {
              role: 'assistant',
              content: 'Previous answer',
              timestamp: '2024-01-15T10:00:01Z',
            },
          ],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context?.conversationHistory).toHaveLength(2);
      }
    });

    it('should reject invalid role in conversationHistory', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Test message',
        context: {
          conversationHistory: [
            {
              role: 'admin', // Invalid role
              content: 'Test',
              timestamp: '2024-01-15T10:00:00Z',
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    it('should coerce timestamp string to Date', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Test message',
        context: {
          conversationHistory: [
            {
              role: 'user',
              content: 'Test',
              timestamp: '2024-01-15T10:00:00Z',
            },
          ],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const history = result.data.context?.conversationHistory;
        expect(history?.[0].timestamp).toBeInstanceOf(Date);
      }
    });

    it('should accept empty context object', () => {
      const result = ChatRequestSchema.safeParse({
        message: 'Test message',
        context: {},
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('QueryParamsSchema', () => {
  describe('limit field', () => {
    it('should default to 100 when not provided', () => {
      const result = QueryParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should accept valid limit', () => {
      const result = QueryParamsSchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should coerce string to number', () => {
      const result = QueryParamsSchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it('should reject limit greater than 1000', () => {
      const result = QueryParamsSchema.safeParse({ limit: '1001' });
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = QueryParamsSchema.safeParse({ limit: '-1' });
      expect(result.success).toBe(false);
    });

    it('should reject zero limit', () => {
      const result = QueryParamsSchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer limit', () => {
      const result = QueryParamsSchema.safeParse({ limit: '10.5' });
      expect(result.success).toBe(false);
    });
  });

  describe('offset field', () => {
    it('should default to 0 when not provided', () => {
      const result = QueryParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept valid offset', () => {
      const result = QueryParamsSchema.safeParse({ offset: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(10);
      }
    });

    it('should accept zero offset', () => {
      const result = QueryParamsSchema.safeParse({ offset: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject negative offset', () => {
      const result = QueryParamsSchema.safeParse({ offset: '-5' });
      expect(result.success).toBe(false);
    });
  });

  describe('order field', () => {
    it('should default to ASC when not provided', () => {
      const result = QueryParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe('ASC');
      }
    });

    it('should accept ASC', () => {
      const result = QueryParamsSchema.safeParse({ order: 'ASC' });
      expect(result.success).toBe(true);
    });

    it('should accept DESC', () => {
      const result = QueryParamsSchema.safeParse({ order: 'DESC' });
      expect(result.success).toBe(true);
    });

    it('should accept lowercase asc', () => {
      const result = QueryParamsSchema.safeParse({ order: 'asc' });
      expect(result.success).toBe(true);
    });

    it('should accept lowercase desc', () => {
      const result = QueryParamsSchema.safeParse({ order: 'desc' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid order value', () => {
      const result = QueryParamsSchema.safeParse({ order: 'RANDOM' });
      expect(result.success).toBe(false);
    });
  });

  describe('optional filter fields', () => {
    it('should accept status filter', () => {
      const result = QueryParamsSchema.safeParse({ status: 'Aprovado' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Aprovado');
      }
    });

    it('should accept category filter', () => {
      const result = QueryParamsSchema.safeParse({ category: 'Frontend' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('Frontend');
      }
    });

    it('should accept city filter', () => {
      const result = QueryParamsSchema.safeParse({ city: 'Sao Paulo' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.city).toBe('Sao Paulo');
      }
    });

    it('should accept orderBy field', () => {
      const result = QueryParamsSchema.safeParse({ orderBy: 'amount' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.orderBy).toBe('amount');
      }
    });

    it('should accept multiple filters', () => {
      const result = QueryParamsSchema.safeParse({
        status: 'Aprovado',
        category: 'Frontend',
        limit: '50',
        offset: '10',
        orderBy: 'amount',
        order: 'DESC',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Aprovado');
        expect(result.data.category).toBe('Frontend');
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
        expect(result.data.orderBy).toBe('amount');
        expect(result.data.order).toBe('DESC');
      }
    });
  });
});
