/**
 * Database Service Tests
 * Tests for database operations and mock data handling
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  getAllTables,
  getTableSchema,
  getAllTableSchemas,
  executeQuery,
  executeRawQuery,
  getTableData,
  tableExists,
} from './database.js';

beforeAll(() => {
  // Ensure we're in mock mode
  process.env.SUPABASE_URL = '';
  process.env.SUPABASE_ANON_KEY = '';
});

describe('getAllTables', () => {
  it('should return an array of table names', () => {
    const tables = getAllTables();
    expect(Array.isArray(tables)).toBe(true);
    expect(tables.length).toBeGreaterThan(0);
  });

  it('should include expected tables', () => {
    const tables = getAllTables();
    expect(tables).toContain('transactions');
    expect(tables).toContain('products');
    expect(tables).toContain('customers');
    expect(tables).toContain('orders');
  });
});

describe('tableExists', () => {
  it('should return true for existing tables', () => {
    expect(tableExists('transactions')).toBe(true);
    expect(tableExists('products')).toBe(true);
    expect(tableExists('customers')).toBe(true);
    expect(tableExists('orders')).toBe(true);
  });

  it('should return false for non-existing tables', () => {
    expect(tableExists('nonexistent')).toBe(false);
    expect(tableExists('users')).toBe(false);
    expect(tableExists('')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(tableExists('TRANSACTIONS')).toBe(true);
    expect(tableExists('Transactions')).toBe(true);
    expect(tableExists('TrAnSaCtIoNs')).toBe(true);
  });
});

describe('getTableSchema', () => {
  it('should return schema for existing table', () => {
    const schema = getTableSchema('transactions');
    expect(schema).not.toBeNull();
    expect(schema!.name).toBe('transactions');
    expect(Array.isArray(schema!.columns)).toBe(true);
  });

  it('should return null for non-existing table', () => {
    const schema = getTableSchema('nonexistent');
    expect(schema).toBeNull();
  });

  it('should include column definitions', () => {
    const schema = getTableSchema('transactions');
    expect(schema!.columns.length).toBeGreaterThan(0);

    const idColumn = schema!.columns.find(c => c.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn!.type).toBe('integer');
    expect(idColumn!.isPrimaryKey).toBe(true);
  });

  it('should include row count', () => {
    const schema = getTableSchema('transactions');
    expect(typeof schema!.rowCount).toBe('number');
    expect(schema!.rowCount).toBeGreaterThan(0);
  });

  it('should be case-insensitive', () => {
    const schema = getTableSchema('TRANSACTIONS');
    expect(schema).not.toBeNull();
    expect(schema!.name).toBe('transactions');
  });
});

describe('getAllTableSchemas', () => {
  it('should return array of all schemas', () => {
    const schemas = getAllTableSchemas();
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.length).toBe(4);
  });

  it('should include schema for each table', () => {
    const schemas = getAllTableSchemas();
    const tableNames = schemas.map(s => s.name);

    expect(tableNames).toContain('transactions');
    expect(tableNames).toContain('products');
    expect(tableNames).toContain('customers');
    expect(tableNames).toContain('orders');
  });
});

describe('executeQuery', () => {
  describe('basic queries', () => {
    it('should return data for valid table', async () => {
      const result = await executeQuery('transactions');

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.rowCount).toBeGreaterThan(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('should return empty data for non-existing table', async () => {
      const result = await executeQuery('nonexistent');

      expect(result.data).toEqual([]);
      expect(result.rowCount).toBe(0);
    });

    it('should include execution time', async () => {
      const result = await executeQuery('transactions');

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('with limit option', () => {
    it('should limit results', async () => {
      const result = await executeQuery('transactions', { limit: 5 });

      expect(result.data.length).toBeLessThanOrEqual(5);
    });

    it('should return all if limit is greater than data', async () => {
      const result = await executeQuery('transactions', { limit: 1000 });

      expect(result.data.length).toBe(result.rowCount);
    });
  });

  describe('with offset option', () => {
    it('should skip rows with offset', async () => {
      const allResult = await executeQuery('transactions');
      const offsetResult = await executeQuery('transactions', { offset: 5 });

      expect(offsetResult.data.length).toBe(allResult.data.length - 5);
    });

    it('should return empty if offset exceeds data', async () => {
      const result = await executeQuery('transactions', { offset: 1000 });

      expect(result.data.length).toBe(0);
    });
  });

  describe('with filters option', () => {
    it('should filter by status', async () => {
      const result = await executeQuery('transactions', {
        filters: { status: 'Aprovado' },
      });

      result.data.forEach(row => {
        expect((row.status as string).toLowerCase()).toContain('aprovado');
      });
    });

    it('should filter by multiple fields', async () => {
      const result = await executeQuery('products', {
        filters: { category: 'Frontend' },
      });

      result.data.forEach(row => {
        expect((row.category as string).toLowerCase()).toBe('frontend');
      });
    });
  });

  describe('with orderBy option', () => {
    it('should order ascending', async () => {
      const result = await executeQuery('transactions', {
        orderBy: { column: 'amount', direction: 'ASC' },
      });

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].amount).toBeGreaterThanOrEqual(result.data[i - 1].amount as number);
      }
    });

    it('should order descending', async () => {
      const result = await executeQuery('transactions', {
        orderBy: { column: 'amount', direction: 'DESC' },
      });

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].amount).toBeLessThanOrEqual(result.data[i - 1].amount as number);
      }
    });
  });

  describe('combined options', () => {
    it('should apply filter, order, and limit together', async () => {
      const result = await executeQuery('transactions', {
        filters: { status: 'Aprovado' },
        orderBy: { column: 'amount', direction: 'DESC' },
        limit: 5,
      });

      expect(result.data.length).toBeLessThanOrEqual(5);
      result.data.forEach(row => {
        expect((row.status as string).toLowerCase()).toContain('aprovado');
      });
    });
  });
});

describe('executeRawQuery', () => {
  describe('SELECT queries', () => {
    it('should execute basic SELECT', async () => {
      const result = await executeRawQuery('SELECT * FROM transactions');

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.rowCount).toBeGreaterThan(0);
    });

    it('should handle non-existent table', async () => {
      const result = await executeRawQuery('SELECT * FROM nonexistent');

      expect(result.data).toEqual([]);
      expect(result.rowCount).toBe(0);
    });
  });

  describe('COUNT queries', () => {
    it('should execute COUNT(*)', async () => {
      const result = await executeRawQuery('SELECT COUNT(*) FROM transactions');

      expect(result.data.length).toBe(1);
      expect(result.data[0].count).toBeGreaterThan(0);
    });

    it('should execute COUNT with GROUP BY', async () => {
      const result = await executeRawQuery(
        'SELECT status, COUNT(*) FROM transactions GROUP BY status'
      );

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(row => {
        expect(row.status).toBeDefined();
        expect(row.count).toBeGreaterThan(0);
      });
    });

    it('should execute COUNT with WHERE', async () => {
      const result = await executeRawQuery(
        "SELECT COUNT(*) FROM transactions WHERE status = 'Aprovado'"
      );

      expect(result.data.length).toBe(1);
      expect(result.data[0].count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SUM queries', () => {
    it('should execute SUM', async () => {
      const result = await executeRawQuery('SELECT SUM(amount) FROM transactions');

      expect(result.data.length).toBe(1);
      expect(typeof result.data[0].sum).toBe('number');
      expect(result.data[0].sum).toBeGreaterThan(0);
    });

    it('should execute SUM with GROUP BY', async () => {
      const result = await executeRawQuery(
        'SELECT status, SUM(amount) FROM transactions GROUP BY status'
      );

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(row => {
        expect(row.status).toBeDefined();
        expect(typeof row.sum).toBe('number');
      });
    });
  });

  describe('AVG queries', () => {
    it('should execute AVG', async () => {
      const result = await executeRawQuery('SELECT AVG(amount) FROM transactions');

      expect(result.data.length).toBe(1);
      expect(typeof result.data[0].avg).toBe('number');
    });
  });

  describe('MAX queries', () => {
    it('should execute MAX', async () => {
      const result = await executeRawQuery('SELECT MAX(amount) FROM transactions');

      expect(result.data.length).toBe(1);
      expect(typeof result.data[0].max).toBe('number');
    });
  });

  describe('MIN queries', () => {
    it('should execute MIN', async () => {
      const result = await executeRawQuery('SELECT MIN(amount) FROM transactions');

      expect(result.data.length).toBe(1);
      expect(typeof result.data[0].min).toBe('number');
    });
  });

  describe('WHERE clause', () => {
    it('should handle equals with string', async () => {
      const result = await executeRawQuery(
        "SELECT * FROM transactions WHERE status = 'Aprovado'"
      );

      result.data.forEach(row => {
        expect((row.status as string).toLowerCase()).toBe('aprovado');
      });
    });

    it('should handle equals with number', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions WHERE id = 1'
      );

      expect(result.data.length).toBeLessThanOrEqual(1);
      if (result.data.length > 0) {
        expect(result.data[0].id).toBe(1);
      }
    });

    it('should handle greater than', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions WHERE amount > 2000'
      );

      result.data.forEach(row => {
        expect(row.amount).toBeGreaterThan(2000);
      });
    });

    it('should handle less than', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions WHERE amount < 1000'
      );

      result.data.forEach(row => {
        expect(row.amount).toBeLessThan(1000);
      });
    });

    it('should handle LIKE', async () => {
      const result = await executeRawQuery(
        "SELECT * FROM transactions WHERE customer LIKE '%Silva%'"
      );

      result.data.forEach(row => {
        expect((row.customer as string).toLowerCase()).toContain('silva');
      });
    });

    it('should handle multiple conditions with AND', async () => {
      const result = await executeRawQuery(
        "SELECT * FROM transactions WHERE status = 'Aprovado' AND amount > 1500"
      );

      result.data.forEach(row => {
        expect((row.status as string).toLowerCase()).toBe('aprovado');
        expect(row.amount).toBeGreaterThan(1500);
      });
    });
  });

  describe('ORDER BY clause', () => {
    it('should handle ORDER BY ASC', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions ORDER BY amount ASC'
      );

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].amount).toBeGreaterThanOrEqual(result.data[i - 1].amount as number);
      }
    });

    it('should handle ORDER BY DESC', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions ORDER BY amount DESC'
      );

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].amount).toBeLessThanOrEqual(result.data[i - 1].amount as number);
      }
    });

    it('should default to ASC when direction not specified', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions ORDER BY amount'
      );

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].amount).toBeGreaterThanOrEqual(result.data[i - 1].amount as number);
      }
    });
  });

  describe('LIMIT clause', () => {
    it('should handle LIMIT', async () => {
      const result = await executeRawQuery('SELECT * FROM transactions LIMIT 5');

      expect(result.data.length).toBeLessThanOrEqual(5);
    });

    it('should handle LIMIT with ORDER BY', async () => {
      const result = await executeRawQuery(
        'SELECT * FROM transactions ORDER BY amount DESC LIMIT 3'
      );

      expect(result.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('complex queries', () => {
    it('should handle combined clauses', async () => {
      const result = await executeRawQuery(
        "SELECT * FROM transactions WHERE status = 'Aprovado' ORDER BY amount DESC LIMIT 5"
      );

      expect(result.data.length).toBeLessThanOrEqual(5);
      result.data.forEach(row => {
        expect((row.status as string).toLowerCase()).toBe('aprovado');
      });
    });
  });
});

describe('getTableData', () => {
  it('should return data for table', async () => {
    const data = await getTableData('transactions');

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should respect limit parameter', async () => {
    const data = await getTableData('transactions', 5);

    expect(data.length).toBeLessThanOrEqual(5);
  });

  it('should return empty array for non-existing table', async () => {
    const data = await getTableData('nonexistent');

    expect(data).toEqual([]);
  });
});

describe('Mock data integrity', () => {
  it('should have consistent transaction data', async () => {
    const result = await executeQuery('transactions');

    result.data.forEach(row => {
      expect(row.id).toBeDefined();
      expect(row.date).toBeDefined();
      expect(typeof row.amount).toBe('number');
      expect(row.status).toBeDefined();
      expect(row.customer).toBeDefined();
      expect(row.product).toBeDefined();
    });
  });

  it('should have consistent product data', async () => {
    const result = await executeQuery('products');

    result.data.forEach(row => {
      expect(row.id).toBeDefined();
      expect(row.name).toBeDefined();
      expect(typeof row.price).toBe('number');
      expect(row.category).toBeDefined();
      expect(typeof row.stock).toBe('number');
    });
  });

  it('should have consistent customer data', async () => {
    const result = await executeQuery('customers');

    result.data.forEach(row => {
      expect(row.id).toBeDefined();
      expect(row.name).toBeDefined();
      expect(row.email).toBeDefined();
      expect(row.city).toBeDefined();
      expect(typeof row.total_purchases).toBe('number');
    });
  });

  it('should have consistent order data', async () => {
    const result = await executeQuery('orders');

    result.data.forEach(row => {
      expect(row.id).toBeDefined();
      expect(typeof row.customer_id).toBe('number');
      expect(typeof row.product_id).toBe('number');
      expect(typeof row.quantity).toBe('number');
      expect(typeof row.total).toBe('number');
      expect(row.status).toBeDefined();
    });
  });
});
