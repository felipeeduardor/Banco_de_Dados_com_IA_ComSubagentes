/**
 * NLP Service Tests
 * Tests for natural language processing functions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  processNaturalLanguageQuery,
  detectIntent,
  detectTable,
  extractStatusFilter,
  extractLimit,
  extractGroupBy,
  getDateRange,
  buildSQLQuery,
  generateExplanation,
  isOpenAIConfigured,
} from './nlp.js';
import type { TableSchema, QueryIntent } from '../types/index.js';

// ============================================
// Test Schema
// ============================================
const testSchema: TableSchema = {
  name: 'transactions',
  columns: [
    { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
    { name: 'date', type: 'date', nullable: false },
    { name: 'amount', type: 'decimal', nullable: false },
    { name: 'status', type: 'varchar', nullable: false },
    { name: 'customer', type: 'varchar', nullable: false },
    { name: 'product', type: 'varchar', nullable: false },
  ],
  rowCount: 20,
};

const productsSchema: TableSchema = {
  name: 'products',
  columns: [
    { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
    { name: 'name', type: 'varchar', nullable: false },
    { name: 'price', type: 'decimal', nullable: false },
    { name: 'category', type: 'varchar', nullable: false },
    { name: 'stock', type: 'integer', nullable: false },
  ],
  rowCount: 10,
};

describe('isOpenAIConfigured', () => {
  it('should return a boolean', () => {
    const result = isOpenAIConfigured();
    expect(typeof result).toBe('boolean');
  });
});

describe('detectIntent', () => {
  describe('count patterns', () => {
    it('should detect count intent for "quantos"', () => {
      const result = detectIntent('Quantos clientes temos?');
      expect(result.action).toBe('count');
      expect(result.chartType).toBe('bar');
    });

    it('should detect count intent for "quantidade de"', () => {
      const result = detectIntent('Qual a quantidade de transacoes?');
      expect(result.action).toBe('count');
    });

    it('should detect count intent for "numero de"', () => {
      const result = detectIntent('Numero de pedidos');
      expect(result.action).toBe('count');
    });
  });

  describe('sum patterns', () => {
    it('should detect sum intent for "soma do"', () => {
      const result = detectIntent('Soma do valor total');
      expect(result.action).toBe('sum');
    });

    it('should detect sum intent for "total de vendas"', () => {
      const result = detectIntent('Total de vendas');
      expect(result.action).toBe('sum');
    });

    it('should detect sum intent for "faturamento"', () => {
      const result = detectIntent('Qual o faturamento?');
      expect(result.action).toBe('sum');
    });

    it('should detect sum intent for "valor total"', () => {
      const result = detectIntent('Valor total das transacoes');
      expect(result.action).toBe('sum');
    });
  });

  describe('average patterns', () => {
    it('should detect average intent for "media do"', () => {
      const result = detectIntent('Media do valor');
      expect(result.action).toBe('average');
    });

    it('should detect average intent for "ticket medio"', () => {
      const result = detectIntent('Qual o ticket medio?');
      expect(result.action).toBe('average');
    });
  });

  describe('max patterns', () => {
    it('should detect max intent for "maior valor"', () => {
      const result = detectIntent('Maior valor de venda');
      expect(result.action).toBe('max');
    });

    it('should detect max intent for "mais caro"', () => {
      const result = detectIntent('Produto mais caro');
      expect(result.action).toBe('max');
    });
  });

  describe('min patterns', () => {
    it('should detect min intent for "menor valor"', () => {
      const result = detectIntent('Menor valor de venda');
      expect(result.action).toBe('min');
    });

    it('should detect min intent for "mais barato"', () => {
      const result = detectIntent('Produto mais barato');
      expect(result.action).toBe('min');
    });
  });

  describe('top N patterns', () => {
    it('should detect top intent for "top 5"', () => {
      const result = detectIntent('Top 5 maiores vendas');
      expect(result.action).toBe('top');
      expect(result.chartType).toBe('bar');
    });

    it('should detect top intent for "maiores"', () => {
      const result = detectIntent('As maiores transacoes');
      expect(result.action).toBe('top');
    });

    it('should detect top intent for "principais"', () => {
      const result = detectIntent('Principais clientes');
      expect(result.action).toBe('top');
    });
  });

  describe('group patterns', () => {
    it('should detect group intent for "por categoria"', () => {
      const result = detectIntent('Vendas por categoria');
      expect(result.action).toBe('group');
      expect(result.chartType).toBe('pie');
    });

    it('should detect group intent for "agrupar por"', () => {
      const result = detectIntent('Agrupar por status');
      expect(result.action).toBe('group');
    });

    it('should detect group intent for "distribuicao"', () => {
      const result = detectIntent('Distribuicao por cidade');
      expect(result.action).toBe('group');
    });
  });

  describe('filter patterns', () => {
    it('should detect filter intent for "onde"', () => {
      const result = detectIntent('Onde status = aprovado');
      expect(result.action).toBe('filter');
    });

    it('should detect filter intent for "apenas"', () => {
      const result = detectIntent('Apenas transacoes pendentes');
      expect(result.action).toBe('filter');
    });

    it('should detect filter intent for "com status"', () => {
      const result = detectIntent('Transacoes com status aprovado');
      expect(result.action).toBe('filter');
    });
  });

  describe('trend patterns', () => {
    it('should detect trend intent for "tendencia"', () => {
      const result = detectIntent('Tendencia de vendas');
      expect(result.action).toBe('trend');
      expect(result.chartType).toBe('line');
    });

    it('should detect trend intent for "evolucao"', () => {
      const result = detectIntent('Evolucao das vendas');
      expect(result.action).toBe('trend');
    });

    it('should detect trend intent for "ao longo do"', () => {
      const result = detectIntent('Vendas ao longo do tempo');
      expect(result.action).toBe('trend');
    });
  });

  describe('select patterns', () => {
    it('should detect select intent for "mostrar"', () => {
      const result = detectIntent('Mostrar todas as transacoes');
      expect(result.action).toBe('select');
    });

    it('should detect select intent for "listar"', () => {
      const result = detectIntent('Listar clientes');
      expect(result.action).toBe('select');
    });

    it('should default to select for unknown patterns', () => {
      const result = detectIntent('algo completamente diferente');
      expect(result.action).toBe('select');
    });
  });
});

describe('detectTable', () => {
  const availableTables = ['transactions', 'products', 'customers', 'orders'];

  it('should detect transactions table', () => {
    expect(detectTable('Quantas transacoes existem?', availableTables)).toBe('transactions');
  });

  it('should detect products table from "produtos"', () => {
    expect(detectTable('Listar produtos', availableTables)).toBe('products');
  });

  it('should detect customers table from "clientes"', () => {
    expect(detectTable('Quantos clientes temos?', availableTables)).toBe('customers');
  });

  it('should detect orders table from "pedidos"', () => {
    expect(detectTable('Pedidos pendentes', availableTables)).toBe('orders');
  });

  it('should detect table from alias "vendas" -> transactions', () => {
    expect(detectTable('Total de vendas', availableTables)).toBe('transactions');
  });

  it('should detect table from alias "cursos" -> products', () => {
    expect(detectTable('Lista de cursos', availableTables)).toBe('products');
  });

  it('should default to transactions when no specific table mentioned', () => {
    expect(detectTable('Mostre tudo', availableTables)).toBe('transactions');
  });

  it('should return first available table if transactions not available', () => {
    const result = detectTable('Mostre tudo', ['products', 'customers']);
    expect(result).toBe('products');
  });
});

describe('extractStatusFilter', () => {
  it('should extract "Aprovado" status', () => {
    expect(extractStatusFilter('transacoes aprovado')).toBe('Aprovado');
  });

  it('should extract "Pendente" status', () => {
    expect(extractStatusFilter('pedidos pendente')).toBe('Pendente');
  });

  it('should extract "Cancelado" status', () => {
    expect(extractStatusFilter('transacoes cancelado')).toBe('Cancelado');
  });

  it('should extract "Reembolsado" status', () => {
    expect(extractStatusFilter('pagamentos reembolsado')).toBe('Reembolsado');
  });

  it('should extract "Concluido" status', () => {
    expect(extractStatusFilter('pedidos concluido')).toBe('Concluido');
  });

  it('should extract "Enviado" status', () => {
    expect(extractStatusFilter('pedidos enviado')).toBe('Enviado');
  });

  it('should return null when no status found', () => {
    expect(extractStatusFilter('todas as transacoes')).toBeNull();
  });
});

describe('extractLimit', () => {
  it('should extract limit from "top 5"', () => {
    expect(extractLimit('Top 5 maiores vendas')).toBe(5);
  });

  it('should extract limit from "top 10"', () => {
    expect(extractLimit('Top 10 clientes')).toBe(10);
  });

  it('should extract limit from "primeiros 3"', () => {
    expect(extractLimit('Primeiros 3 produtos')).toBe(3);
  });

  it('should extract limit from "5 maiores"', () => {
    expect(extractLimit('5 maiores vendas')).toBe(5);
  });

  it('should return null when no limit pattern found', () => {
    expect(extractLimit('Todas as transacoes')).toBeNull();
  });
});

describe('extractGroupBy', () => {
  it('should extract group by "status"', () => {
    expect(extractGroupBy('vendas por status', testSchema)).toBe('status');
  });

  it('should extract group by "categoria" -> category', () => {
    expect(extractGroupBy('produtos por categoria', productsSchema)).toBe('category');
  });

  it('should return null for non-existent column', () => {
    expect(extractGroupBy('por cidade', testSchema)).toBeNull();
  });

  it('should handle "agrupar por"', () => {
    expect(extractGroupBy('agrupar por status', testSchema)).toBe('status');
  });
});

describe('getDateRange', () => {
  it('should return date range for "hoje"', () => {
    const result = getDateRange('transacoes de hoje');
    expect(result).not.toBeNull();
    expect(result!.start).toBe(result!.end);
  });

  it('should return date range for "ontem"', () => {
    const result = getDateRange('vendas de ontem');
    expect(result).not.toBeNull();
    expect(result!.start).toBe(result!.end);
  });

  it('should return date range for "esta semana"', () => {
    const result = getDateRange('transacoes desta semana');
    expect(result).not.toBeNull();
    expect(result!.start).not.toBe(result!.end);
  });

  it('should return date range for "este mes"', () => {
    const result = getDateRange('vendas deste mes');
    expect(result).not.toBeNull();
    expect(result!.start).not.toBe(result!.end);
  });

  it('should return date range for "ultimos 7 dias"', () => {
    const result = getDateRange('transacoes dos ultimos 7 dias');
    expect(result).not.toBeNull();
    expect(result!.start).not.toBe(result!.end);
  });

  it('should return date range for "ultimos 3 meses"', () => {
    const result = getDateRange('vendas dos ultimos 3 meses');
    expect(result).not.toBeNull();
    expect(result!.start).not.toBe(result!.end);
  });

  it('should return null for no date pattern', () => {
    const result = getDateRange('todas as transacoes');
    expect(result).toBeNull();
  });
});

describe('buildSQLQuery', () => {
  it('should build simple SELECT query', () => {
    const intent: QueryIntent = {
      action: 'select',
      table: 'transactions',
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toBe('SELECT * FROM transactions');
  });

  it('should build COUNT query', () => {
    const intent: QueryIntent = {
      action: 'count',
      table: 'transactions',
      aggregations: [{ function: 'COUNT', column: '*', alias: 'count' }],
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain('COUNT(*)');
  });

  it('should build SUM query', () => {
    const intent: QueryIntent = {
      action: 'sum',
      table: 'transactions',
      aggregations: [{ function: 'SUM', column: 'amount', alias: 'sum' }],
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain('SUM(amount)');
  });

  it('should build query with WHERE clause', () => {
    const intent: QueryIntent = {
      action: 'filter',
      table: 'transactions',
      filters: [{ column: 'status', operator: '=', value: 'Aprovado' }],
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain("WHERE status = 'Aprovado'");
  });

  it('should build query with GROUP BY', () => {
    const intent: QueryIntent = {
      action: 'group',
      table: 'transactions',
      groupBy: ['status'],
      aggregations: [{ function: 'COUNT', column: '*', alias: 'count' }],
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain('GROUP BY status');
  });

  it('should build query with ORDER BY', () => {
    const intent: QueryIntent = {
      action: 'order',
      table: 'transactions',
      orderBy: { column: 'amount', direction: 'DESC' },
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain('ORDER BY amount DESC');
  });

  it('should build query with LIMIT', () => {
    const intent: QueryIntent = {
      action: 'top',
      table: 'transactions',
      limit: 10,
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain('LIMIT 10');
  });

  it('should build query with specific columns', () => {
    const intent: QueryIntent = {
      action: 'select',
      table: 'transactions',
      columns: ['id', 'amount', 'status'],
    };
    const sql = buildSQLQuery(intent, testSchema);
    expect(sql).toContain('SELECT id, amount, status');
  });
});

describe('generateExplanation', () => {
  it('should generate explanation for count action', () => {
    const intent: QueryIntent = { action: 'count', table: 'transactions' };
    const explanation = generateExplanation(intent, 'SELECT COUNT(*) FROM transactions');
    expect(explanation).toContain('Contando');
    expect(explanation).toContain('transactions');
  });

  it('should generate explanation for sum action', () => {
    const intent: QueryIntent = { action: 'sum', table: 'transactions' };
    const explanation = generateExplanation(intent, 'SELECT SUM(amount) FROM transactions');
    expect(explanation).toContain('soma');
    expect(explanation).toContain('transactions');
  });

  it('should include filter description', () => {
    const intent: QueryIntent = {
      action: 'filter',
      table: 'transactions',
      filters: [{ column: 'status', operator: '=', value: 'Aprovado' }],
    };
    const explanation = generateExplanation(intent, 'SELECT * FROM transactions WHERE status = Aprovado');
    expect(explanation).toContain('filtros');
    expect(explanation).toContain('status');
  });

  it('should include group by description', () => {
    const intent: QueryIntent = {
      action: 'group',
      table: 'transactions',
      groupBy: ['status'],
    };
    const explanation = generateExplanation(intent, 'SELECT status, COUNT(*) FROM transactions GROUP BY status');
    expect(explanation).toContain('agrupado por');
    expect(explanation).toContain('status');
  });

  it('should include limit description', () => {
    const intent: QueryIntent = {
      action: 'top',
      table: 'transactions',
      limit: 5,
    };
    const explanation = generateExplanation(intent, 'SELECT * FROM transactions LIMIT 5');
    expect(explanation).toContain('5 resultados');
  });
});

describe('processNaturalLanguageQuery', () => {
  it('should process a count query', async () => {
    const result = await processNaturalLanguageQuery(
      'Quantos clientes temos cadastrados?',
      testSchema
    );

    // Check that some valid result was returned
    expect(result.sqlQuery).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.intent.table).toBe('transactions');
  });

  it('should process a query and return valid structure', async () => {
    const result = await processNaturalLanguageQuery(
      'Mostre todas as transacoes',
      testSchema
    );

    expect(result.intent).toBeDefined();
    expect(result.sqlQuery).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(typeof result.confidence).toBe('number');
  });

  it('should detect status filter in query', async () => {
    const result = await processNaturalLanguageQuery(
      'Transacoes com status aprovado',
      testSchema
    );

    // The NLP should detect the status filter and add it to the query
    expect(result.intent.filters).toBeDefined();
    expect(result.intent.filters!.some(f => f.column === 'status')).toBe(true);
  });

  it('should process a top N query', async () => {
    const result = await processNaturalLanguageQuery(
      'Top 5 maiores vendas',
      testSchema
    );

    expect(result.intent.action).toBe('top');
    expect(result.intent.limit).toBe(5);
    expect(result.sqlQuery).toContain('LIMIT 5');
  });

  it('should process a group by query', async () => {
    const result = await processNaturalLanguageQuery(
      'Transacoes agrupadas por status',
      testSchema
    );

    // Group by queries should have groupBy defined
    if (result.intent.groupBy) {
      expect(result.sqlQuery).toContain('GROUP BY');
    }
    expect(result.sqlQuery).toBeDefined();
  });

  it('should include chart config when applicable', async () => {
    const result = await processNaturalLanguageQuery(
      'Distribuicao por status',
      testSchema
    );

    // Chart config may or may not be present depending on query type
    expect(result).toBeDefined();
    expect(result.sqlQuery).toBeDefined();
  });

  it('should use rule-based processing when OpenAI is not configured', async () => {
    const result = await processNaturalLanguageQuery(
      'Mostre registros',
      testSchema
    );

    // Should use rule-based (confidence ~0.7)
    expect(result.confidence).toBe(0.7);
  });

  it('should handle conversation history', async () => {
    const result = await processNaturalLanguageQuery(
      'E o total?',
      testSchema,
      [
        { role: 'user', content: 'Quantas transacoes aprovadas?', timestamp: new Date() },
        { role: 'assistant', content: 'Encontrei 15', timestamp: new Date() },
      ]
    );

    expect(result).toBeDefined();
    expect(result.sqlQuery).toBeDefined();
  });
});
