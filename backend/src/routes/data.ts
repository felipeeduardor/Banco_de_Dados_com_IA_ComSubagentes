/**
 * Data Routes
 * Handles table data and schema endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, handleZodError, Errors } from '../middleware/errorHandler.js';
import {
  getAllTables,
  getTableSchema,
  getAllTableSchemas,
  executeQuery,
  tableExists,
} from '../services/database.js';
import type { ApiResponse, TableSchema } from '../types/index.js';

const router = Router();

// ============================================
// Query Parameters Schema
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

// ============================================
// GET /api/data/tables - List All Tables
// ============================================
router.get(
  '/tables',
  asyncHandler(async (_req: Request, res: Response) => {
    const tables = getAllTables();
    const schemas = getAllTableSchemas();

    const tableInfo = tables.map((tableName) => {
      const schema = schemas.find((s) => s.name === tableName);
      return {
        name: tableName,
        displayName: formatTableName(tableName),
        columnCount: schema?.columns.length || 0,
        rowCount: schema?.rowCount || 0,
      };
    });

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        tables: tableInfo,
        total: tables.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/data/schemas - Get All Schemas
// ============================================
router.get(
  '/schemas',
  asyncHandler(async (_req: Request, res: Response) => {
    const schemas = getAllTableSchemas();

    const formattedSchemas = schemas.map((schema) => ({
      ...schema,
      displayName: formatTableName(schema.name),
      columns: schema.columns.map((col) => ({
        ...col,
        displayName: formatColumnName(col.name),
      })),
    }));

    const apiResponse: ApiResponse = {
      success: true,
      data: { schemas: formattedSchemas },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/data/:tableName - Get Table Data
// ============================================
router.get(
  '/:tableName',
  asyncHandler(async (req: Request, res: Response) => {
    const { tableName } = req.params;

    // Validate table exists
    if (!tableExists(tableName)) {
      throw Errors.notFound(`Tabela '${tableName}'`);
    }

    // Parse and validate query params
    const parseResult = QueryParamsSchema.safeParse(req.query);
    if (!parseResult.success) {
      throw handleZodError(parseResult.error);
    }

    const { limit, offset, orderBy, order, status, category, city } = parseResult.data;

    // Build filters from query params
    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (city) filters.city = city;

    // Execute query
    const result = await executeQuery(tableName, {
      limit,
      offset,
      orderBy: orderBy ? { column: orderBy, direction: order.toUpperCase() as 'ASC' | 'DESC' } : undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    // Get total count (without limit/offset)
    const totalResult = await executeQuery(tableName, { filters: Object.keys(filters).length > 0 ? filters : undefined });

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        tableName,
        displayName: formatTableName(tableName),
        rows: result.data,
        pagination: {
          total: totalResult.rowCount,
          limit,
          offset,
          hasMore: offset + limit < totalResult.rowCount,
        },
        executionTime: result.executionTime,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/data/:tableName/schema - Get Table Schema
// ============================================
router.get(
  '/:tableName/schema',
  asyncHandler(async (req: Request, res: Response) => {
    const { tableName } = req.params;

    // Validate table exists
    if (!tableExists(tableName)) {
      throw Errors.notFound(`Tabela '${tableName}'`);
    }

    const schema = getTableSchema(tableName);
    if (!schema) {
      throw Errors.internal(`Erro ao obter schema da tabela '${tableName}'`);
    }

    const formattedSchema: TableSchema & { displayName: string } = {
      ...schema,
      displayName: formatTableName(schema.name),
      columns: schema.columns.map((col) => ({
        ...col,
        displayName: formatColumnName(col.name),
      })),
    };

    const apiResponse: ApiResponse = {
      success: true,
      data: { schema: formattedSchema },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/data/:tableName/stats - Get Table Statistics
// ============================================
router.get(
  '/:tableName/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { tableName } = req.params;

    // Validate table exists
    if (!tableExists(tableName)) {
      throw Errors.notFound(`Tabela '${tableName}'`);
    }

    const schema = getTableSchema(tableName);
    if (!schema) {
      throw Errors.internal(`Erro ao obter schema da tabela '${tableName}'`);
    }

    // Get all data for statistics
    const result = await executeQuery(tableName);
    const data = result.data;

    // Calculate statistics for numeric columns
    const numericColumns = schema.columns.filter((col) =>
      ['decimal', 'integer', 'numeric'].includes(col.type.toLowerCase()) && col.name !== 'id'
    );

    const stats: Record<string, unknown> = {
      totalRows: data.length,
    };

    for (const col of numericColumns) {
      const values = data.map((row) => Number(row[col.name]) || 0);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      const max = Math.max(...values);
      const min = Math.min(...values);

      stats[col.name] = {
        sum: Math.round(sum * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        max,
        min,
      };
    }

    // Calculate distribution for categorical columns
    const categoricalColumns = schema.columns.filter((col) =>
      col.type.toLowerCase() === 'varchar' && !['name', 'email', 'customer', 'product'].includes(col.name)
    );

    for (const col of categoricalColumns) {
      const distribution = data.reduce<Record<string, number>>((acc, row) => {
        const value = String(row[col.name] ?? 'N/A');
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

      stats[`${col.name}_distribution`] = distribution;
    }

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        tableName,
        displayName: formatTableName(tableName),
        stats,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/data/:tableName/distinct/:column - Get Distinct Values
// ============================================
router.get(
  '/:tableName/distinct/:column',
  asyncHandler(async (req: Request, res: Response) => {
    const { tableName, column } = req.params;

    // Validate table exists
    if (!tableExists(tableName)) {
      throw Errors.notFound(`Tabela '${tableName}'`);
    }

    const schema = getTableSchema(tableName);
    if (!schema) {
      throw Errors.internal(`Erro ao obter schema da tabela '${tableName}'`);
    }

    // Validate column exists
    const columnExists = schema.columns.some((col) => col.name.toLowerCase() === column.toLowerCase());
    if (!columnExists) {
      throw Errors.badRequest(`Coluna '${column}' nao encontrada na tabela '${tableName}'`);
    }

    // Get all data and extract distinct values
    const result = await executeQuery(tableName);
    const distinctValues = [...new Set(result.data.map((row) => row[column]))];

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        tableName,
        column,
        values: distinctValues,
        count: distinctValues.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// Helper Functions
// ============================================

function formatTableName(name: string): string {
  const translations: Record<string, string> = {
    transactions: 'Transacoes',
    products: 'Produtos',
    customers: 'Clientes',
    orders: 'Pedidos',
  };

  return translations[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
}

function formatColumnName(name: string): string {
  const translations: Record<string, string> = {
    id: 'ID',
    date: 'Data',
    amount: 'Valor',
    status: 'Status',
    customer: 'Cliente',
    product: 'Produto',
    name: 'Nome',
    price: 'Preco',
    category: 'Categoria',
    stock: 'Estoque',
    email: 'E-mail',
    city: 'Cidade',
    total_purchases: 'Total de Compras',
    created_at: 'Data de Criacao',
    customer_id: 'ID do Cliente',
    product_id: 'ID do Produto',
    quantity: 'Quantidade',
    total: 'Total',
  };

  return translations[name.toLowerCase()] || name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export default router;
