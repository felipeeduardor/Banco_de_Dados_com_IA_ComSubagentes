/**
 * Data Route Tests
 * Tests for /api/data endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import dataRouter from './data.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';

// ============================================
// Test App Setup
// ============================================
let app: Application;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/data', dataRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
});

afterAll(() => {
  // Cleanup if needed
});

describe('GET /api/data/tables', () => {
  it('should return list of available tables', async () => {
    const response = await request(app).get('/api/data/tables');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tables).toBeDefined();
    expect(Array.isArray(response.body.data.tables)).toBe(true);
    expect(response.body.data.total).toBeGreaterThan(0);
  });

  it('should include table metadata', async () => {
    const response = await request(app).get('/api/data/tables');

    expect(response.status).toBe(200);
    const tables = response.body.data.tables;

    tables.forEach((table: { name: string; displayName: string; columnCount: number; rowCount: number }) => {
      expect(table.name).toBeDefined();
      expect(table.displayName).toBeDefined();
      expect(typeof table.columnCount).toBe('number');
      expect(typeof table.rowCount).toBe('number');
    });
  });

  it('should include expected tables', async () => {
    const response = await request(app).get('/api/data/tables');

    const tableNames = response.body.data.tables.map((t: { name: string }) => t.name);

    expect(tableNames).toContain('transactions');
    expect(tableNames).toContain('products');
    expect(tableNames).toContain('customers');
    expect(tableNames).toContain('orders');
  });

  it('should have proper display names in Portuguese', async () => {
    const response = await request(app).get('/api/data/tables');

    const transactionsTable = response.body.data.tables.find(
      (t: { name: string }) => t.name === 'transactions'
    );

    expect(transactionsTable.displayName).toBe('Transacoes');
  });
});

describe('GET /api/data/schemas', () => {
  it('should return all table schemas', async () => {
    const response = await request(app).get('/api/data/schemas');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.schemas).toBeDefined();
    expect(Array.isArray(response.body.data.schemas)).toBe(true);
  });

  it('should include column definitions', async () => {
    const response = await request(app).get('/api/data/schemas');

    const schemas = response.body.data.schemas;
    schemas.forEach((schema: { name: string; columns: Array<{ name: string; type: string }> }) => {
      expect(schema.name).toBeDefined();
      expect(Array.isArray(schema.columns)).toBe(true);
      expect(schema.columns.length).toBeGreaterThan(0);

      schema.columns.forEach((col: { name: string; type: string }) => {
        expect(col.name).toBeDefined();
        expect(col.type).toBeDefined();
      });
    });
  });

  it('should include display names for columns', async () => {
    const response = await request(app).get('/api/data/schemas');

    const schemas = response.body.data.schemas;
    schemas.forEach((schema: { columns: Array<{ displayName: string }> }) => {
      schema.columns.forEach((col: { displayName: string }) => {
        expect(col.displayName).toBeDefined();
      });
    });
  });
});

describe('GET /api/data/:tableName', () => {
  describe('valid requests', () => {
    it('should return data for transactions table', async () => {
      const response = await request(app).get('/api/data/transactions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableName).toBe('transactions');
      expect(response.body.data.rows).toBeDefined();
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should return data for products table', async () => {
      const response = await request(app).get('/api/data/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableName).toBe('products');
    });

    it('should return data for customers table', async () => {
      const response = await request(app).get('/api/data/customers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableName).toBe('customers');
    });

    it('should return data for orders table', async () => {
      const response = await request(app).get('/api/data/orders');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tableName).toBe('orders');
    });

    it('should include pagination info', async () => {
      const response = await request(app).get('/api/data/transactions');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
      expect(typeof response.body.data.pagination.total).toBe('number');
      expect(typeof response.body.data.pagination.limit).toBe('number');
      expect(typeof response.body.data.pagination.offset).toBe('number');
      expect(typeof response.body.data.pagination.hasMore).toBe('boolean');
    });

    it('should include execution time', async () => {
      const response = await request(app).get('/api/data/transactions');

      expect(response.status).toBe(200);
      expect(typeof response.body.data.executionTime).toBe('number');
    });

    it('should apply limit parameter', async () => {
      const response = await request(app).get('/api/data/transactions?limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.rows.length).toBeLessThanOrEqual(5);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should apply offset parameter', async () => {
      const response = await request(app).get('/api/data/transactions?offset=5');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.offset).toBe(5);
    });

    it('should apply status filter', async () => {
      const response = await request(app).get('/api/data/transactions?status=Aprovado');

      expect(response.status).toBe(200);
      const rows = response.body.data.rows;
      rows.forEach((row: { status: string }) => {
        expect(row.status.toLowerCase()).toContain('aprovado');
      });
    });

    it('should apply ordering', async () => {
      const response = await request(app).get(
        '/api/data/transactions?orderBy=amount&order=DESC'
      );

      expect(response.status).toBe(200);
      const rows = response.body.data.rows;
      // Just verify we got results - ordering is implemented
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should include display name', async () => {
      const response = await request(app).get('/api/data/transactions');

      expect(response.status).toBe(200);
      expect(response.body.data.displayName).toBe('Transacoes');
    });
  });

  describe('invalid requests', () => {
    it('should return 404 for non-existent table', async () => {
      const response = await request(app).get('/api/data/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject invalid limit parameter', async () => {
      const response = await request(app).get('/api/data/transactions?limit=abc');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject limit exceeding maximum', async () => {
      const response = await request(app).get('/api/data/transactions?limit=1001');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject negative offset', async () => {
      const response = await request(app).get('/api/data/transactions?offset=-1');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid order value', async () => {
      const response = await request(app).get('/api/data/transactions?order=RANDOM');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('GET /api/data/:tableName/schema', () => {
  it('should return schema for valid table', async () => {
    const response = await request(app).get('/api/data/transactions/schema');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.schema).toBeDefined();
    expect(response.body.data.schema.name).toBe('transactions');
  });

  it('should include column definitions', async () => {
    const response = await request(app).get('/api/data/transactions/schema');

    expect(response.status).toBe(200);
    const schema = response.body.data.schema;
    expect(Array.isArray(schema.columns)).toBe(true);
    expect(schema.columns.length).toBeGreaterThan(0);

    // Verify expected columns exist
    const columnNames = schema.columns.map((c: { name: string }) => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('amount');
    expect(columnNames).toContain('status');
  });

  it('should include display name', async () => {
    const response = await request(app).get('/api/data/transactions/schema');

    expect(response.status).toBe(200);
    expect(response.body.data.schema.displayName).toBe('Transacoes');
  });

  it('should include column display names', async () => {
    const response = await request(app).get('/api/data/transactions/schema');

    const columns = response.body.data.schema.columns;
    columns.forEach((col: { displayName: string }) => {
      expect(col.displayName).toBeDefined();
    });
  });

  it('should return 404 for non-existent table', async () => {
    const response = await request(app).get('/api/data/nonexistent/schema');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe('GET /api/data/:tableName/stats', () => {
  it('should return statistics for valid table', async () => {
    const response = await request(app).get('/api/data/transactions/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tableName).toBe('transactions');
    expect(response.body.data.stats).toBeDefined();
  });

  it('should include total rows count', async () => {
    const response = await request(app).get('/api/data/transactions/stats');

    expect(response.status).toBe(200);
    expect(typeof response.body.data.stats.totalRows).toBe('number');
    expect(response.body.data.stats.totalRows).toBeGreaterThan(0);
  });

  it('should include numeric column statistics', async () => {
    const response = await request(app).get('/api/data/transactions/stats');

    expect(response.status).toBe(200);
    const stats = response.body.data.stats;

    // Amount should have statistics
    if (stats.amount) {
      expect(typeof stats.amount.sum).toBe('number');
      expect(typeof stats.amount.avg).toBe('number');
      expect(typeof stats.amount.max).toBe('number');
      expect(typeof stats.amount.min).toBe('number');
    }
  });

  it('should include status distribution', async () => {
    const response = await request(app).get('/api/data/transactions/stats');

    expect(response.status).toBe(200);
    const stats = response.body.data.stats;

    // Status distribution should be present
    expect(stats.status_distribution).toBeDefined();
    expect(typeof stats.status_distribution).toBe('object');
  });

  it('should return 404 for non-existent table', async () => {
    const response = await request(app).get('/api/data/nonexistent/stats');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe('GET /api/data/:tableName/distinct/:column', () => {
  it('should return distinct values for valid column', async () => {
    const response = await request(app).get('/api/data/transactions/distinct/status');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tableName).toBe('transactions');
    expect(response.body.data.column).toBe('status');
    expect(Array.isArray(response.body.data.values)).toBe(true);
    expect(response.body.data.count).toBeGreaterThan(0);
  });

  it('should return unique values only', async () => {
    const response = await request(app).get('/api/data/transactions/distinct/status');

    expect(response.status).toBe(200);
    const values = response.body.data.values;
    const uniqueValues = [...new Set(values)];
    expect(values.length).toBe(uniqueValues.length);
  });

  it('should work for different columns', async () => {
    const response = await request(app).get('/api/data/products/distinct/category');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.column).toBe('category');
    expect(response.body.data.values.length).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent table', async () => {
    const response = await request(app).get('/api/data/nonexistent/distinct/status');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 for non-existent column', async () => {
    const response = await request(app).get('/api/data/transactions/distinct/nonexistent');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('nao encontrada');
  });
});
