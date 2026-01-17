/**
 * Chat Route
 * Handles natural language queries and returns data insights
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, handleZodError, Errors } from '../middleware/errorHandler.js';
import { processNaturalLanguageQuery } from '../services/nlp.js';
import { executeRawQuery, getTableSchema, getAllTables, tableExists } from '../services/database.js';
import type { ChatResponse, ChartData, ChartDataset, ApiResponse } from '../types/index.js';

const router = Router();

// ============================================
// Request Validation Schema
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
// Chart Data Generation
// ============================================
function generateChartData(
  data: Record<string, unknown>[],
  chartType: string,
  title: string
): ChartData | undefined {
  if (!data || data.length === 0) {
    return undefined;
  }

  // Try to identify label and value columns
  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  // Find label column (usually string type)
  let labelKey = keys.find((k) =>
    ['status', 'category', 'name', 'product', 'customer', 'city', 'date'].includes(k.toLowerCase())
  );
  if (!labelKey) {
    labelKey = keys.find((k) => typeof firstRow[k] === 'string');
  }

  // Find value columns (usually numeric type)
  const valueKeys = keys.filter((k) => {
    const val = firstRow[k];
    return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
  });

  if (!labelKey && valueKeys.length === 0) {
    return undefined;
  }

  // For aggregation results without label, use default
  if (!labelKey && valueKeys.length > 0) {
    // Single aggregation result
    if (data.length === 1) {
      const labels = valueKeys.map((k) => formatLabel(k));
      const values = valueKeys.map((k) => Number(firstRow[k]) || 0);

      return {
        type: chartType as ChartData['type'],
        title,
        labels,
        datasets: [
          {
            label: 'Valor',
            data: values,
            backgroundColor: generateColors(values.length),
          },
        ],
      };
    }
  }

  // Extract labels
  const labels = labelKey
    ? data.map((row) => formatLabel(String(row[labelKey] ?? 'N/A')))
    : data.map((_, i) => `Item ${i + 1}`);

  // Build datasets
  const datasets: ChartDataset[] = valueKeys.slice(0, 3).map((key, index) => ({
    label: formatLabel(key),
    data: data.map((row) => Number(row[key]) || 0),
    backgroundColor: generateColors(data.length, index),
    borderColor: generateColors(data.length, index, true),
  }));

  // For pie charts, only use first dataset with multiple colors
  if (chartType === 'pie' && datasets.length > 0) {
    datasets[0].backgroundColor = generateColors(data.length);
  }

  return {
    type: chartType as ChartData['type'],
    title,
    labels,
    datasets,
  };
}

function formatLabel(text: string): string {
  // Capitalize first letter and replace underscores with spaces
  return text
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function generateColors(count: number, seriesIndex: number = 0, border: boolean = false): string[] {
  const baseColors = [
    ['#3B82F6', '#60A5FA', '#93C5FD'], // Blue
    ['#10B981', '#34D399', '#6EE7B7'], // Green
    ['#F59E0B', '#FBBF24', '#FCD34D'], // Yellow
    ['#EF4444', '#F87171', '#FCA5A5'], // Red
    ['#8B5CF6', '#A78BFA', '#C4B5FD'], // Purple
    ['#EC4899', '#F472B6', '#F9A8D4'], // Pink
    ['#06B6D4', '#22D3EE', '#67E8F9'], // Cyan
    ['#F97316', '#FB923C', '#FDBA74'], // Orange
  ];

  const palette = baseColors[seriesIndex % baseColors.length];
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const colorIndex = i % palette.length;
    let color = palette[colorIndex];

    if (border) {
      // Darken for border
      color = color.replace(/^#/, '');
      const r = Math.max(0, parseInt(color.slice(0, 2), 16) - 30);
      const g = Math.max(0, parseInt(color.slice(2, 4), 16) - 30);
      const b = Math.max(0, parseInt(color.slice(4, 6), 16) - 30);
      color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    colors.push(color);
  }

  return colors;
}

// ============================================
// Generate Natural Language Response
// ============================================
function generateNaturalResponse(
  data: Record<string, unknown>[],
  explanation: string,
  action: string
): string {
  if (!data || data.length === 0) {
    return 'Nenhum resultado encontrado para sua consulta.';
  }

  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  // For aggregation results
  if (data.length === 1) {
    if ('count' in firstRow) {
      return `Encontrei **${firstRow.count}** registros. ${explanation}`;
    }
    if ('sum' in firstRow) {
      const sum = Number(firstRow.sum);
      return `O valor total e **R$ ${sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**. ${explanation}`;
    }
    if ('avg' in firstRow) {
      const avg = Number(firstRow.avg);
      return `A media e **R$ ${avg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**. ${explanation}`;
    }
    if ('max' in firstRow) {
      const max = Number(firstRow.max);
      return `O valor maximo e **R$ ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**. ${explanation}`;
    }
    if ('min' in firstRow) {
      const min = Number(firstRow.min);
      return `O valor minimo e **R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**. ${explanation}`;
    }
  }

  // For grouped results
  if (data.length > 1 && keys.length === 2) {
    const labelKey = keys.find((k) => !['count', 'sum', 'avg', 'max', 'min'].includes(k));
    const valueKey = keys.find((k) => ['count', 'sum', 'avg', 'max', 'min'].includes(k));

    if (labelKey && valueKey) {
      const summary = data
        .slice(0, 5)
        .map((row) => {
          const label = row[labelKey];
          const value = Number(row[valueKey]);
          return `- **${label}**: ${value.toLocaleString('pt-BR')}`;
        })
        .join('\n');

      const remaining = data.length > 5 ? `\n... e mais ${data.length - 5} itens.` : '';
      return `Aqui esta a distribuicao:\n\n${summary}${remaining}\n\n${explanation}`;
    }
  }

  // For list results
  if (action === 'select' || action === 'filter' || action === 'top') {
    return `Encontrei **${data.length}** registros. ${explanation}`;
  }

  return `Consulta realizada com sucesso. ${explanation}`;
}

// ============================================
// POST /api/chat - Main Chat Endpoint
// ============================================
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const parseResult = ChatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw handleZodError(parseResult.error);
    }

    const { message, context } = parseResult.data;

    // Determine target table
    let tableName = context?.tableName || 'transactions';
    const availableTables = getAllTables();

    // Try to detect table from message if not specified
    if (!context?.tableName) {
      const messageLower = message.toLowerCase();
      for (const table of availableTables) {
        if (messageLower.includes(table) || messageLower.includes(table.slice(0, -1))) {
          tableName = table;
          break;
        }
      }
    }

    // Validate table exists
    if (!tableExists(tableName)) {
      throw Errors.badRequest(`Tabela '${tableName}' nao encontrada. Tabelas disponiveis: ${availableTables.join(', ')}`);
    }

    // Get table schema
    const schema = getTableSchema(tableName);
    if (!schema) {
      throw Errors.internal(`Erro ao obter schema da tabela '${tableName}'`);
    }

    // Process natural language query
    const nlpResult = await processNaturalLanguageQuery(
      message,
      schema,
      context?.conversationHistory
    );

    // Execute the generated SQL query
    const queryResult = await executeRawQuery(nlpResult.sqlQuery);

    // Generate chart data if applicable
    let chartData: ChartData | undefined;
    if (nlpResult.chartConfig && queryResult.data.length > 0) {
      chartData = generateChartData(
        queryResult.data,
        nlpResult.chartConfig.type,
        nlpResult.chartConfig.title
      );
    }

    // Generate natural language response
    const responseMessage = generateNaturalResponse(
      queryResult.data,
      nlpResult.explanation,
      nlpResult.intent.action
    );

    // Build response
    const chatResponse: ChatResponse = {
      message: responseMessage,
      sqlQuery: nlpResult.sqlQuery,
      data: queryResult.data,
      chartData,
    };

    const apiResponse: ApiResponse<ChatResponse> = {
      success: true,
      data: chatResponse,
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/chat/suggestions - Query Suggestions
// ============================================
router.get(
  '/suggestions',
  asyncHandler(async (_req: Request, res: Response) => {
    const suggestions = [
      {
        category: 'Contagem',
        examples: [
          'Quantas transacoes foram realizadas?',
          'Quantos clientes estao cadastrados?',
          'Quantos pedidos estao pendentes?',
        ],
      },
      {
        category: 'Totais',
        examples: [
          'Qual o total de vendas aprovadas?',
          'Qual o faturamento total?',
          'Qual a soma dos pedidos concluidos?',
        ],
      },
      {
        category: 'Agrupamentos',
        examples: [
          'Quantas transacoes por status?',
          'Total de vendas por produto',
          'Clientes por cidade',
        ],
      },
      {
        category: 'Rankings',
        examples: [
          'Top 5 maiores vendas',
          'Top 10 clientes',
          'Produtos mais vendidos',
        ],
      },
      {
        category: 'Filtros',
        examples: [
          'Transacoes aprovadas',
          'Pedidos pendentes',
          'Clientes de Sao Paulo',
        ],
      },
    ];

    const apiResponse: ApiResponse = {
      success: true,
      data: { suggestions },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// ============================================
// GET /api/chat/history - Get Chat History (placeholder)
// ============================================
router.get(
  '/history',
  asyncHandler(async (_req: Request, res: Response) => {
    // In a real application, this would fetch from a database
    const apiResponse: ApiResponse = {
      success: true,
      data: {
        history: [],
        message: 'Historico de conversas nao persistido nesta versao.',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

export default router;
