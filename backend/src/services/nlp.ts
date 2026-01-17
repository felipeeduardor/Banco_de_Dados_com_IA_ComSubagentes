/**
 * Natural Language Processing Service
 * Converts natural language questions to SQL queries
 */

import OpenAI from 'openai';
import type {
  TableSchema,
  NLPQueryResult,
  QueryIntent,
  IntentAction,
  ChartConfig,
  ChartType,
  ConversationMessage,
} from '../types/index.js';

// ============================================
// OpenAI Configuration
// ============================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return openaiClient;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(OPENAI_API_KEY);
}

// ============================================
// Intent Detection Patterns (Portuguese)
// ============================================
interface IntentPattern {
  patterns: RegExp[];
  action: IntentAction;
  chartType?: ChartType;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Best selling / Most popular patterns (MUST BE FIRST - highest priority)
  {
    patterns: [
      /mais\s+vendid[oa]s?/i,
      /mais\s+comprad[oa]s?/i,
      /mais\s+popular(?:es)?/i,
      /campe(?:ao|oes)\s+de\s+vendas?/i,
      /que\s+(?:mais\s+)?vende(?:m|u)?/i,
      /qual\s+(?:o\s+)?produto.*mais/i,
      /produtos?\s+(?:que\s+)?mais/i,
      /mais\s+pedid[oa]s?/i,
      /mais\s+solicitad[oa]s?/i,
    ],
    action: 'group',
    chartType: 'bar',
  },
  // Count patterns
  {
    patterns: [
      /quant[oa]s?\s/i,          // quantos, quantas, quanto, quanta
      /quantidade\s+de/i,
      /numero\s+de/i,
      /total\s+de\s+(?!valor|vendas|compras)/i,
      /conte\s/i,
      /contar\s/i,
      /quantidad/i,              // quantidades, quantidade
    ],
    action: 'count',
    chartType: 'bar',
  },
  // Sum patterns
  {
    patterns: [
      /soma\s+(?:de|do|da|dos|das)/i,
      /somar\s/i,
      /total\s+(?:de\s+)?(?:valor|vendas|compras|amount|faturamento)/i,
      /faturamento/i,
      /receita\s+total/i,
      /valor\s+total/i,
    ],
    action: 'sum',
    chartType: 'bar',
  },
  // Average patterns
  {
    patterns: [
      /media\s+(?:de|do|da)/i,
      /valor\s+medio/i,
      /ticket\s+medio/i,
      /preco\s+medio/i,
    ],
    action: 'average',
    chartType: 'bar',
  },
  // Max patterns
  {
    patterns: [
      /maior\s+(?:valor|venda|compra)/i,
      /maximo\s/i,
      /mais\s+caro/i,
      /mais\s+alto/i,
      /top\s+1\b/i,
    ],
    action: 'max',
  },
  // Min patterns
  {
    patterns: [
      /menor\s+(?:valor|venda|compra)/i,
      /minimo\s/i,
      /mais\s+barato/i,
      /mais\s+baixo/i,
    ],
    action: 'min',
  },
  // Top N patterns
  {
    patterns: [
      /top\s+\d+/i,
      /maiores/i,
      /principais/i,
      /melhores/i,
      /primeiros?\s+\d+/i,
    ],
    action: 'top',
    chartType: 'bar',
  },
  // Group patterns
  {
    patterns: [
      /por\s+(?:categoria|status|cidade|produto|cliente|mes|dia)/i,
      /agrupar\s+por/i,
      /agrupado\s+por/i,
      /distribuicao\s+(?:de|por)/i,
    ],
    action: 'group',
    chartType: 'pie',
  },
  // Filter patterns
  {
    patterns: [
      /onde\s/i,
      /filtrar?\s/i,
      /apenas\s/i,
      /somente\s/i,
      /com\s+status/i,
      /que\s+(?:tem|tenha|sao|estao)/i,
    ],
    action: 'filter',
  },
  // Order patterns
  {
    patterns: [
      /ordenar?\s+por/i,
      /ordem\s+(?:crescente|decrescente)/i,
      /do\s+maior\s+para/i,
      /do\s+menor\s+para/i,
    ],
    action: 'order',
  },
  // Trend patterns
  {
    patterns: [
      /tendencia/i,
      /evolucao/i,
      /ao\s+longo\s+(?:do|de)/i,
      /historico/i,
      /por\s+(?:dia|semana|mes|ano)/i,
    ],
    action: 'trend',
    chartType: 'line',
  },
  // Compare patterns
  {
    patterns: [
      /comparar?\s/i,
      /comparacao/i,
      /versus/i,
      /vs\.?/i,
      /diferenca\s+entre/i,
    ],
    action: 'compare',
    chartType: 'bar',
  },
  // Default select
  {
    patterns: [
      /mostrar?\s/i,
      /listar?\s/i,
      /exibir?\s/i,
      /ver\s/i,
      /quais?\s/i,
      /todos?\s/i,
    ],
    action: 'select',
    chartType: 'table',
  },
];

// ============================================
// Status Pattern Mapping (Portuguese to DB values)
// ============================================
const STATUS_MAPPING: Record<string, string[]> = {
  aprovado: ['aprovado', 'aprovada', 'aprovados', 'aprovadas', 'approved'],
  pendente: ['pendente', 'pendentes', 'pending'],
  cancelado: ['cancelado', 'cancelada', 'cancelados', 'canceladas', 'cancelled', 'canceled'],
  reembolsado: ['reembolsado', 'reembolsada', 'reembolsados', 'reembolsadas', 'refunded'],
  concluido: ['concluido', 'concluida', 'concluidos', 'concluidas', 'completed', 'done'],
  enviado: ['enviado', 'enviada', 'enviados', 'enviadas', 'shipped', 'sent'],
};

// ============================================
// Date Pattern Helpers
// ============================================
interface DateRange {
  start: string;
  end: string;
}

function getDateRange(text: string): DateRange | null {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // Today
  if (/hoje/i.test(text)) {
    const dateStr = today.toISOString().split('T')[0];
    return { start: dateStr, end: dateStr };
  }

  // Yesterday
  if (/ontem/i.test(text)) {
    const yesterday = new Date(year, month, day - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    return { start: dateStr, end: dateStr };
  }

  // This week
  if (/esta\s+semana|semana\s+atual/i.test(text)) {
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(year, month, day - dayOfWeek);
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  // This month
  if (/este\s+mes|mes\s+atual/i.test(text)) {
    const startOfMonth = new Date(year, month, 1);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  // This year
  if (/este\s+ano|ano\s+atual/i.test(text)) {
    const startOfYear = new Date(year, 0, 1);
    return {
      start: startOfYear.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  // Last N days
  const lastDaysMatch = text.match(/ultimos?\s+(\d+)\s+dias?/i);
  if (lastDaysMatch) {
    const days = parseInt(lastDaysMatch[1], 10);
    const startDate = new Date(year, month, day - days);
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  // Last N months
  const lastMonthsMatch = text.match(/ultimos?\s+(\d+)\s+(?:mes|meses)/i);
  if (lastMonthsMatch) {
    const months = parseInt(lastMonthsMatch[1], 10);
    const startDate = new Date(year, month - months, day);
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  }

  return null;
}

// ============================================
// Column Detection
// ============================================
function detectColumns(text: string, schema: TableSchema): string[] {
  const columns: string[] = [];

  for (const col of schema.columns) {
    const colName = col.name.toLowerCase();
    const textLower = text.toLowerCase();

    // Direct column name match
    if (textLower.includes(colName)) {
      columns.push(col.name);
      continue;
    }

    // Common aliases
    const aliases: Record<string, string[]> = {
      amount: ['valor', 'preco', 'total', 'faturamento', 'receita'],
      date: ['data', 'dia', 'quando'],
      customer: ['cliente', 'comprador', 'usuario'],
      product: ['produto', 'curso', 'item'],
      status: ['status', 'situacao', 'estado'],
      name: ['nome'],
      email: ['email', 'e-mail'],
      city: ['cidade', 'local', 'localidade'],
      category: ['categoria', 'tipo'],
      quantity: ['quantidade', 'qtd', 'unidades'],
      stock: ['estoque', 'disponivel'],
    };

    const colAliases = aliases[colName] || [];
    if (colAliases.some((alias) => textLower.includes(alias))) {
      columns.push(col.name);
    }
  }

  return columns;
}

// ============================================
// Table Detection
// ============================================
function detectTable(text: string, availableTables: string[]): string | null {
  const textLower = text.toLowerCase();

  // Table aliases in Portuguese
  const tableAliases: Record<string, string[]> = {
    transactions: ['transacao', 'transacoes', 'venda', 'vendas', 'pagamento', 'pagamentos'],
    products: ['produto', 'produtos', 'curso', 'cursos', 'item', 'itens'],
    customers: ['cliente', 'clientes', 'comprador', 'compradores', 'usuario', 'usuarios'],
    orders: ['pedido', 'pedidos', 'compra', 'compras', 'ordem', 'ordens'],
  };

  // Check direct table name match
  for (const table of availableTables) {
    if (textLower.includes(table.toLowerCase())) {
      return table;
    }
  }

  // Check aliases
  for (const [table, aliases] of Object.entries(tableAliases)) {
    if (availableTables.includes(table) && aliases.some((alias) => textLower.includes(alias))) {
      return table;
    }
  }

  // Default to transactions if no specific table mentioned
  if (availableTables.includes('transactions')) {
    return 'transactions';
  }

  return availableTables[0] || null;
}

// ============================================
// Extract Status Filter
// ============================================
function extractStatusFilter(text: string): string | null {
  const textLower = text.toLowerCase();

  for (const [status, variants] of Object.entries(STATUS_MAPPING)) {
    if (variants.some((v) => textLower.includes(v))) {
      // Return the capitalized version for matching DB values
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  return null;
}

// ============================================
// Extract Limit
// ============================================
function extractLimit(text: string): number | null {
  // Top N pattern
  const topMatch = text.match(/top\s+(\d+)/i);
  if (topMatch) {
    return parseInt(topMatch[1], 10);
  }

  // First N pattern
  const firstMatch = text.match(/(?:primeiro|primeiros|primeiro)\s+(\d+)/i);
  if (firstMatch) {
    return parseInt(firstMatch[1], 10);
  }

  // N maiores/melhores pattern
  const nMatch = text.match(/(\d+)\s+(?:maiores?|melhores?|principais?)/i);
  if (nMatch) {
    return parseInt(nMatch[1], 10);
  }

  return null;
}

// ============================================
// Extract Group By Column
// ============================================
function extractGroupBy(text: string, schema: TableSchema): string | null {
  const groupByMatch = text.match(/(?:por|agrupar?\s+por|agrupado\s+por)\s+(\w+)/i);
  if (groupByMatch) {
    const groupCol = groupByMatch[1].toLowerCase();

    // Map Portuguese terms to column names
    const groupAliases: Record<string, string> = {
      categoria: 'category',
      status: 'status',
      situacao: 'status',
      cidade: 'city',
      produto: 'product',
      cliente: 'customer',
      mes: 'date',
      dia: 'date',
    };

    const mappedCol = groupAliases[groupCol] || groupCol;

    // Verify column exists in schema
    if (schema.columns.some((col) => col.name.toLowerCase() === mappedCol)) {
      return mappedCol;
    }
  }

  return null;
}

// ============================================
// Detect Intent from Text
// ============================================
function detectIntent(text: string): { action: IntentAction; chartType?: ChartType } {
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.patterns.some((p) => p.test(text))) {
      return { action: pattern.action, chartType: pattern.chartType };
    }
  }

  return { action: 'select', chartType: 'table' };
}

// ============================================
// Build SQL Query from Intent
// ============================================
function buildSQLQuery(intent: QueryIntent, schema: TableSchema): string {
  const parts: string[] = [];
  const table = schema.name;

  // SELECT clause
  if (intent.aggregations && intent.aggregations.length > 0) {
    const aggParts = intent.aggregations.map((agg) => {
      const alias = agg.alias || agg.function.toLowerCase();
      return `${agg.function}(${agg.column}) AS ${alias}`;
    });

    if (intent.groupBy && intent.groupBy.length > 0) {
      parts.push(`SELECT ${intent.groupBy.join(', ')}, ${aggParts.join(', ')}`);
    } else {
      parts.push(`SELECT ${aggParts.join(', ')}`);
    }
  } else if (intent.columns && intent.columns.length > 0) {
    parts.push(`SELECT ${intent.columns.join(', ')}`);
  } else {
    parts.push('SELECT *');
  }

  // FROM clause
  parts.push(`FROM ${table}`);

  // WHERE clause
  if (intent.filters && intent.filters.length > 0) {
    const conditions = intent.filters.map((filter) => {
      const value = typeof filter.value === 'string' ? `'${filter.value}'` : filter.value;
      return `${filter.column} ${filter.operator} ${value}`;
    });
    parts.push(`WHERE ${conditions.join(' AND ')}`);
  }

  // GROUP BY clause
  if (intent.groupBy && intent.groupBy.length > 0) {
    parts.push(`GROUP BY ${intent.groupBy.join(', ')}`);
  }

  // ORDER BY clause
  if (intent.orderBy) {
    parts.push(`ORDER BY ${intent.orderBy.column} ${intent.orderBy.direction}`);
  } else if (intent.action === 'top' || intent.action === 'max') {
    // Default ordering for top/max queries
    const numericCol = schema.columns.find((c) => ['decimal', 'integer', 'numeric'].includes(c.type.toLowerCase()));
    if (numericCol) {
      parts.push(`ORDER BY ${numericCol.name} DESC`);
    }
  }

  // LIMIT clause
  if (intent.limit) {
    parts.push(`LIMIT ${intent.limit}`);
  }

  return parts.join(' ');
}

// ============================================
// Generate Explanation in Portuguese
// ============================================
function generateExplanation(intent: QueryIntent, _sql: string): string {
  const explanations: Record<IntentAction, string> = {
    count: `Contando registros na tabela ${intent.table}`,
    sum: `Calculando a soma dos valores na tabela ${intent.table}`,
    average: `Calculando a media dos valores na tabela ${intent.table}`,
    max: `Encontrando o valor maximo na tabela ${intent.table}`,
    min: `Encontrando o valor minimo na tabela ${intent.table}`,
    select: `Listando registros da tabela ${intent.table}`,
    filter: `Filtrando registros na tabela ${intent.table}`,
    group: `Agrupando dados da tabela ${intent.table}`,
    order: `Ordenando registros da tabela ${intent.table}`,
    top: `Buscando os principais registros da tabela ${intent.table}`,
    trend: `Analisando tendencia na tabela ${intent.table}`,
    compare: `Comparando dados na tabela ${intent.table}`,
  };

  let explanation = explanations[intent.action] || `Consultando dados da tabela ${intent.table}`;

  if (intent.filters && intent.filters.length > 0) {
    const filterDesc = intent.filters
      .map((f) => `${f.column} ${f.operator} ${f.value}`)
      .join(' e ');
    explanation += ` com filtros: ${filterDesc}`;
  }

  if (intent.groupBy && intent.groupBy.length > 0) {
    explanation += ` agrupado por ${intent.groupBy.join(', ')}`;
  }

  if (intent.limit) {
    explanation += ` (limitado a ${intent.limit} resultados)`;
  }

  return explanation;
}

// ============================================
// Determine Chart Configuration
// ============================================
function determineChartConfig(
  intent: QueryIntent,
  chartType?: ChartType
): ChartConfig | undefined {
  if (!chartType || chartType === 'table') {
    return undefined;
  }

  const config: ChartConfig = {
    type: chartType,
    title: generateChartTitle(intent),
  };

  if (intent.groupBy && intent.groupBy.length > 0) {
    config.xAxis = intent.groupBy[0];
  }

  if (intent.aggregations && intent.aggregations.length > 0) {
    config.yAxis = intent.aggregations[0].alias || intent.aggregations[0].function.toLowerCase();
    config.series = intent.aggregations.map((a) => a.alias || a.function.toLowerCase());
  }

  return config;
}

function generateChartTitle(intent: QueryIntent): string {
  const titles: Record<IntentAction, string> = {
    count: `Total de Registros`,
    sum: `Soma de Valores`,
    average: `Media de Valores`,
    max: `Valor Maximo`,
    min: `Valor Minimo`,
    select: `Dados`,
    filter: `Dados Filtrados`,
    group: `Distribuicao`,
    order: `Dados Ordenados`,
    top: `Top Registros`,
    trend: `Tendencia ao Longo do Tempo`,
    compare: `Comparativo`,
  };

  let title = titles[intent.action] || 'Visualizacao de Dados';

  if (intent.groupBy && intent.groupBy.length > 0) {
    title += ` por ${intent.groupBy[0]}`;
  }

  return title;
}

// ============================================
// Detect Best Selling / Most Popular Pattern
// ============================================
function detectBestSellingPattern(question: string): { groupByColumn: string; isRanking: boolean } | null {
  const textLower = question.toLowerCase();

  // Patterns for "most sold/popular product"
  const productPatterns = [
    /mais\s+vendid[oa]/i,
    /mais\s+comprad[oa]/i,
    /mais\s+popular/i,
    /produto.*mais/i,
    /que\s+mais\s+vende/i,
  ];

  // Patterns for "most active customer"
  const customerPatterns = [
    /cliente.*mais\s+(?:compra|ativo|frequente)/i,
    /maior(?:es)?\s+comprador(?:es)?/i,
    /quem\s+mais\s+compra/i,
  ];

  // Patterns for "most sold category"
  const categoryPatterns = [
    /categoria.*mais/i,
    /mais\s+vendid[oa].*categoria/i,
  ];

  if (productPatterns.some(p => p.test(textLower))) {
    return { groupByColumn: 'product', isRanking: true };
  }

  if (customerPatterns.some(p => p.test(textLower))) {
    return { groupByColumn: 'customer', isRanking: true };
  }

  if (categoryPatterns.some(p => p.test(textLower))) {
    return { groupByColumn: 'category', isRanking: true };
  }

  return null;
}

// ============================================
// Main NLP Processing Function (Rule-based)
// ============================================
function processWithRules(
  question: string,
  schema: TableSchema,
  _history?: ConversationMessage[]
): NLPQueryResult {
  // Detect intent and chart type
  const { action, chartType } = detectIntent(question);

  // Build query intent
  const intent: QueryIntent = {
    action,
    table: schema.name,
  };

  // Check for "best selling" / "most popular" patterns FIRST
  const bestSellingPattern = detectBestSellingPattern(question);
  if (bestSellingPattern) {
    // This is a ranking query - group by product/customer and count
    const hasColumn = schema.columns.some(c => c.name === bestSellingPattern.groupByColumn);
    if (hasColumn) {
      intent.action = 'group';
      intent.groupBy = [bestSellingPattern.groupByColumn];
      intent.aggregations = [{ function: 'COUNT', column: '*', alias: 'total' }];
      intent.orderBy = { column: 'total', direction: 'DESC' };
      intent.limit = intent.limit || 10;

      // Build and return immediately
      const sqlQuery = buildSQLQuery(intent, schema);
      const explanation = `Ranking dos ${bestSellingPattern.groupByColumn === 'product' ? 'produtos' :
        bestSellingPattern.groupByColumn === 'customer' ? 'clientes' : 'itens'} mais vendidos`;
      const chartConfig = determineChartConfig(intent, 'bar');

      return {
        intent,
        sqlQuery,
        explanation,
        chartConfig,
        confidence: 0.85,
      };
    }
  }

  // Detect columns to select
  const columns = detectColumns(question, schema);
  if (columns.length > 0) {
    intent.columns = columns;
  }

  // Extract status filter
  const statusFilter = extractStatusFilter(question);
  if (statusFilter) {
    intent.filters = intent.filters || [];
    intent.filters.push({
      column: 'status',
      operator: '=',
      value: statusFilter,
    });
  }

  // Extract date range filter
  const dateRange = getDateRange(question);
  if (dateRange) {
    intent.filters = intent.filters || [];
    const dateCol = schema.columns.find(c => c.name === 'date' || c.name === 'created_at');
    const dateColName = dateCol?.name || 'date';

    if (dateRange.start === dateRange.end) {
      intent.filters.push({
        column: dateColName,
        operator: '=',
        value: dateRange.start,
      });
    } else {
      intent.filters.push({
        column: dateColName,
        operator: '>=',
        value: dateRange.start,
      });
      intent.filters.push({
        column: dateColName,
        operator: '<=',
        value: dateRange.end,
      });
    }
  }

  // Extract group by
  const groupBy = extractGroupBy(question, schema);
  if (groupBy) {
    intent.groupBy = [groupBy];
  }

  // Extract limit
  const limit = extractLimit(question);
  if (limit) {
    intent.limit = limit;
  }

  // Set aggregations based on action
  if (action === 'count') {
    intent.aggregations = [{ function: 'COUNT', column: '*', alias: 'count' }];
    // If there are filters (like status), ensure we're doing a count with those filters
    if (intent.filters && intent.filters.length > 0) {
      // Already has filters, good
    }
  } else if (action === 'sum') {
    const numericCol = schema.columns.find((c) =>
      ['decimal', 'integer', 'numeric'].includes(c.type.toLowerCase()) && c.name !== 'id'
    );
    if (numericCol) {
      intent.aggregations = [{ function: 'SUM', column: numericCol.name, alias: 'sum' }];
    }
  } else if (action === 'average') {
    const numericCol = schema.columns.find((c) =>
      ['decimal', 'integer', 'numeric'].includes(c.type.toLowerCase()) && c.name !== 'id'
    );
    if (numericCol) {
      intent.aggregations = [{ function: 'AVG', column: numericCol.name, alias: 'avg' }];
    }
  } else if (action === 'max') {
    const numericCol = schema.columns.find((c) =>
      ['decimal', 'integer', 'numeric'].includes(c.type.toLowerCase()) && c.name !== 'id'
    );
    if (numericCol) {
      intent.aggregations = [{ function: 'MAX', column: numericCol.name, alias: 'max' }];
    }
  } else if (action === 'min') {
    const numericCol = schema.columns.find((c) =>
      ['decimal', 'integer', 'numeric'].includes(c.type.toLowerCase()) && c.name !== 'id'
    );
    if (numericCol) {
      intent.aggregations = [{ function: 'MIN', column: numericCol.name, alias: 'min' }];
    }
  } else if (action === 'top') {
    // For top queries, order by numeric column descending
    const numericCol = schema.columns.find((c) =>
      ['decimal', 'integer', 'numeric'].includes(c.type.toLowerCase()) && c.name !== 'id'
    );
    if (numericCol) {
      intent.orderBy = { column: numericCol.name, direction: 'DESC' };
    }
    if (!intent.limit) {
      intent.limit = 10; // Default top 10
    }
  } else if (action === 'group' && intent.groupBy && intent.groupBy.length > 0) {
    // For group queries, add COUNT aggregation by default
    if (!intent.aggregations || intent.aggregations.length === 0) {
      intent.aggregations = [{ function: 'COUNT', column: '*', alias: 'total' }];
      intent.orderBy = { column: 'total', direction: 'DESC' };
    }
  }

  // Build SQL query
  const sqlQuery = buildSQLQuery(intent, schema);

  // Generate explanation
  const explanation = generateExplanation(intent, sqlQuery);

  // Determine chart configuration
  const chartConfig = determineChartConfig(intent, chartType);

  return {
    intent,
    sqlQuery,
    explanation,
    chartConfig,
    confidence: 0.7, // Rule-based confidence
  };
}

// ============================================
// OpenAI-based NLP Processing
// ============================================
async function processWithOpenAI(
  question: string,
  schema: TableSchema,
  history?: ConversationMessage[]
): Promise<NLPQueryResult> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI nao configurado');
  }

  const systemPrompt = `Voce e um assistente especializado em converter perguntas em linguagem natural para SQL.
Voce recebera uma pergunta sobre uma tabela de banco de dados e devera gerar a query SQL apropriada.

Tabela: ${schema.name}
Colunas:
${schema.columns.map((c) => `- ${c.name} (${c.type}${c.nullable ? ', nullable' : ''})`).join('\n')}

Responda APENAS com um JSON no seguinte formato:
{
  "sqlQuery": "SELECT ... FROM ${schema.name} ...",
  "explanation": "Explicacao em portugues do que a query faz",
  "chartType": "bar|line|pie|table|null",
  "action": "count|sum|average|max|min|select|filter|group|order|top|trend|compare"
}

Regras:
- Sempre use a tabela ${schema.name}
- Use sintaxe SQL padrao
- Para datas, use formato 'YYYY-MM-DD'
- Retorne apenas o JSON, sem texto adicional`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history for context
  if (history && history.length > 0) {
    for (const msg of history.slice(-5)) { // Last 5 messages
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: question });

  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Resposta vazia do OpenAI');
  }

  try {
    const parsed = JSON.parse(content);

    const intent: QueryIntent = {
      action: parsed.action || 'select',
      table: schema.name,
    };

    return {
      intent,
      sqlQuery: parsed.sqlQuery,
      explanation: parsed.explanation,
      chartConfig: parsed.chartType && parsed.chartType !== 'null'
        ? { type: parsed.chartType, title: parsed.explanation }
        : undefined,
      confidence: 0.9, // AI-based confidence
    };
  } catch {
    throw new Error('Falha ao interpretar resposta do OpenAI');
  }
}

// ============================================
// Main Export Function
// ============================================
export async function processNaturalLanguageQuery(
  question: string,
  schema: TableSchema,
  history?: ConversationMessage[]
): Promise<NLPQueryResult> {
  // Try OpenAI first if configured
  if (isOpenAIConfigured()) {
    try {
      return await processWithOpenAI(question, schema, history);
    } catch (error) {
      console.warn('[NLP] Falha ao usar OpenAI, usando regras:', error);
    }
  }

  // Fallback to rule-based processing
  return processWithRules(question, schema, history);
}

// ============================================
// Utility Exports
// ============================================
export {
  detectIntent,
  detectTable,
  extractStatusFilter,
  extractLimit,
  extractGroupBy,
  getDateRange,
  buildSQLQuery,
  generateExplanation,
};

export default {
  processNaturalLanguageQuery,
  isOpenAIConfigured,
  detectIntent,
  detectTable,
};
