import type { QueryIntent, TimeRange, TransactionStatus } from '../types';

/**
 * Extrai a intencao da query do usuario
 * @param text - Texto da pergunta do usuario
 * @returns A intencao identificada
 */
export function extractIntent(text: string): QueryIntent {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Palavras-chave para cada intencao
  const intentPatterns: Record<QueryIntent, string[]> = {
    count: ['quantos', 'quantas', 'quantidade', 'total de', 'numero de', 'contar'],
    sum: ['soma', 'somar', 'total', 'valor total', 'quanto', 'faturamento', 'receita'],
    average: ['media', 'medio', 'mediana', 'em media'],
    filter: ['filtrar', 'apenas', 'somente', 'onde', 'quais', 'listar', 'mostrar'],
    group: ['por', 'agrupar', 'agrupado', 'categoria', 'tipo', 'separar'],
    sort: ['ordenar', 'ordem', 'maior', 'menor', 'top', 'ranking', 'primeiros'],
    show: ['mostrar', 'exibir', 'ver', 'visualizar', 'listar', 'todos'],
    compare: ['comparar', 'comparacao', 'versus', 'vs', 'diferenca', 'entre'],
  };

  // Verifica cada intencao
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns) {
      if (normalizedText.includes(pattern)) {
        return intent as QueryIntent;
      }
    }
  }

  // Default para show se nenhuma intencao especifica
  return 'show';
}

/**
 * Extrai o range de tempo mencionado na query
 * @param text - Texto da pergunta do usuario
 * @returns O range de tempo identificado ou undefined
 */
export function extractTimeRange(text: string): TimeRange | undefined {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const timePatterns: Record<TimeRange, string[]> = {
    hoje: ['hoje', 'dia de hoje', 'neste dia'],
    semana: ['semana', 'esta semana', 'semana atual', 'ultimos 7 dias', 'semanal'],
    mes: ['mes', 'este mes', 'mes atual', 'ultimos 30 dias', 'mensal'],
    ano: ['ano', 'este ano', 'ano atual', 'ultimos 12 meses', 'anual'],
    custom: ['entre', 'de', 'ate', 'periodo'],
  };

  for (const [range, patterns] of Object.entries(timePatterns)) {
    for (const pattern of patterns) {
      if (normalizedText.includes(pattern)) {
        return range as TimeRange;
      }
    }
  }

  return undefined;
}

/**
 * Extrai o status mencionado na query
 * @param text - Texto da pergunta do usuario
 * @returns O status identificado ou undefined
 */
export function extractStatus(text: string): TransactionStatus | undefined {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const statusPatterns: Record<TransactionStatus, string[]> = {
    aprovado: ['aprovado', 'aprovados', 'aprovada', 'aprovadas', 'concluido', 'sucesso'],
    pendente: ['pendente', 'pendentes', 'aguardando', 'em analise', 'processando'],
    cancelado: ['cancelado', 'cancelados', 'cancelada', 'canceladas', 'negado', 'recusado'],
    processando: ['processando', 'em processamento', 'em andamento'],
  };

  for (const [status, patterns] of Object.entries(statusPatterns)) {
    for (const pattern of patterns) {
      if (normalizedText.includes(pattern)) {
        return status as TransactionStatus;
      }
    }
  }

  return undefined;
}

/**
 * Formata um valor numerico como moeda BRL
 * @param value - Valor numerico
 * @returns String formatada como moeda
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

/**
 * Formata uma data para o padrao brasileiro
 * @param date - Data (string, Date ou timestamp)
 * @returns String formatada
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formata uma data com hora para o padrao brasileiro
 * @param date - Data (string, Date ou timestamp)
 * @returns String formatada
 */
export function formatDateTime(date: string | Date | number | null | undefined): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Formata um numero com separadores de milhar
 * @param value - Valor numerico
 * @returns String formatada
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR').format(numericValue);
}

/**
 * Formata um percentual
 * @param value - Valor numerico (0-100 ou 0-1)
 * @param decimalPlaces - Casas decimais
 * @returns String formatada
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimalPlaces: number = 1
): string {
  if (value === null || value === undefined) {
    return '0%';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '0%';
  }

  // Se o valor for menor que 1, assume que e uma fracao
  const percentValue = numericValue <= 1 && numericValue >= -1
    ? numericValue * 100
    : numericValue;

  return `${percentValue.toFixed(decimalPlaces)}%`;
}

/**
 * Extrai palavras-chave relevantes da query
 * @param text - Texto da pergunta
 * @returns Array de palavras-chave
 */
export function extractKeywords(text: string): string[] {
  // Palavras a ignorar (stopwords em portugues)
  const stopwords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
    'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'e', 'ou', 'mas', 'porem', 'contudo',
    'que', 'qual', 'quais', 'como', 'quando', 'onde',
    'ser', 'estar', 'ter', 'haver', 'fazer',
    'foi', 'era', 'sera', 'esta', 'estao',
    'me', 'te', 'se', 'nos', 'vos',
    'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa',
    'esse', 'essa', 'este', 'esta', 'aquele', 'aquela',
  ]);

  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word));

  return [...new Set(words)];
}

/**
 * Detecta se a query pede um grafico
 * @param text - Texto da pergunta
 * @returns true se pede visualizacao grafica
 */
export function detectChartRequest(text: string): boolean {
  const chartKeywords = [
    'grafico', 'chart', 'visualizar', 'plotar', 'desenhar',
    'evolucao', 'tendencia', 'historico', 'ao longo',
    'comparar', 'comparacao', 'vs', 'versus',
  ];

  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return chartKeywords.some(keyword => normalizedText.includes(keyword));
}

/**
 * Sugere o tipo de grafico baseado na query
 * @param text - Texto da pergunta
 * @returns Tipo de grafico sugerido
 */
export function suggestChartType(text: string): 'bar' | 'line' | 'pie' | 'area' {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Linha para evolucao temporal
  if (['evolucao', 'historico', 'ao longo', 'tendencia', 'crescimento'].some(k => normalizedText.includes(k))) {
    return 'line';
  }

  // Pizza para distribuicao/proporcao
  if (['distribuicao', 'proporcao', 'porcentagem', 'participacao', 'fatia'].some(k => normalizedText.includes(k))) {
    return 'pie';
  }

  // Area para acumulados
  if (['acumulado', 'total acumulado', 'somatorio'].some(k => normalizedText.includes(k))) {
    return 'area';
  }

  // Default para barras
  return 'bar';
}

/**
 * Trunca texto mantendo palavras completas
 * @param text - Texto para truncar
 * @param maxLength - Tamanho maximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}

/**
 * Gera um ID unico
 * @returns String de ID unico
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Debounce de funcao
 * @param func - Funcao a ser debounced
 * @param wait - Tempo de espera em ms
 * @returns Funcao debounced
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}
