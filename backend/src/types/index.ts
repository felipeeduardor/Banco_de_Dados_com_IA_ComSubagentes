/**
 * @fileoverview TypeScript interfaces for the PropIA Delta Backend
 * @description Este modulo contem todas as definicoes de tipos utilizadas
 * pela API do PropIA Delta, incluindo tipos para chat, banco de dados,
 * processamento NLP, visualizacao e autenticacao.
 *
 * @module types
 * @version 1.0.0
 */

// ============================================
// Chat Request/Response Types
// ============================================

/**
 * Contexto da conversa para processamento de mensagens
 * @interface ChatContext
 */
export interface ChatContext {
  /**
   * Nome da tabela alvo para a consulta.
   * Se nao especificado, sera detectado automaticamente da mensagem.
   * @example "transactions"
   */
  tableName?: string;

  /**
   * Historico de mensagens anteriores da conversa.
   * Utilizado para manter contexto em conversas multi-turno.
   */
  conversationHistory?: ConversationMessage[];
}

/**
 * Requisicao de chat enviada pelo cliente
 * @interface ChatRequest
 */
export interface ChatRequest {
  /**
   * Mensagem do usuario em linguagem natural.
   * Deve ter entre 1 e 1000 caracteres.
   * @example "Quantas transacoes foram aprovadas?"
   */
  message: string;

  /**
   * Contexto opcional da conversa
   */
  context?: ChatContext;
}

/**
 * Resposta do endpoint de chat
 * @interface ChatResponse
 */
export interface ChatResponse {
  /**
   * Resposta em linguagem natural gerada pelo sistema.
   * Pode conter markdown para formatacao.
   * @example "Encontrei **15** transacoes aprovadas."
   */
  message: string;

  /**
   * Query SQL gerada a partir da pergunta.
   * Util para debug e transparencia.
   * @example "SELECT COUNT(*) FROM transactions WHERE status = 'Aprovado'"
   */
  sqlQuery?: string;

  /**
   * Dados retornados pela consulta SQL
   */
  data?: Record<string, unknown>[];

  /**
   * Dados formatados para visualizacao em grafico
   */
  chartData?: ChartData;

  /**
   * Mensagem de erro, se ocorrer
   */
  error?: string;
}

/**
 * Mensagem individual em uma conversa
 * @interface ConversationMessage
 */
export interface ConversationMessage {
  /**
   * Papel do remetente da mensagem
   */
  role: 'user' | 'assistant';

  /**
   * Conteudo textual da mensagem
   */
  content: string;

  /**
   * Timestamp da mensagem
   */
  timestamp: Date;
}

// ============================================
// Database Schema Types
// ============================================

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableSchema {
  name: string;
  columns: ColumnDef[];
  rowCount?: number;
}

export interface DatabaseSchema {
  tables: TableSchema[];
}

// ============================================
// NLP Processing Types
// ============================================

export type IntentAction =
  | 'count'      // Contar registros
  | 'sum'        // Somar valores
  | 'average'    // Calcular média
  | 'max'        // Valor máximo
  | 'min'        // Valor mínimo
  | 'select'     // Selecionar registros
  | 'filter'     // Filtrar registros
  | 'group'      // Agrupar registros
  | 'order'      // Ordenar registros
  | 'top'        // Top N registros
  | 'trend'      // Análise de tendência
  | 'compare';   // Comparar valores

export interface QueryFilter {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
  value: string | number | string[] | number[];
}

export interface QueryIntent {
  action: IntentAction;
  table: string;
  columns?: string[];
  filters?: QueryFilter[];
  groupBy?: string[];
  orderBy?: {
    column: string;
    direction: 'ASC' | 'DESC';
  };
  limit?: number;
  aggregations?: {
    function: 'COUNT' | 'SUM' | 'AVG' | 'MAX' | 'MIN';
    column: string;
    alias?: string;
  }[];
}

export interface NLPQueryResult {
  intent: QueryIntent;
  sqlQuery: string;
  explanation: string;
  chartConfig?: ChartConfig;
  confidence: number;
}

// ============================================
// Chart/Visualization Types
// ============================================

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'table';

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartData {
  type: ChartType;
  title: string;
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

// ============================================
// API Error Types
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

// ============================================
// Mock Data Types
// ============================================

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  status: 'Aprovado' | 'Pendente' | 'Cancelado' | 'Reembolsado';
  customer: string;
  product: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  city: string;
  total_purchases: number;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  total: number;
  status: 'Concluido' | 'Pendente' | 'Enviado' | 'Cancelado';
  created_at: string;
}

export type MockDataType = Transaction | Product | Customer | Order;

// ============================================
// Service Types
// ============================================

export interface QueryExecutionResult {
  data: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface NLPProcessingContext {
  schema: TableSchema;
  conversationHistory?: ConversationMessage[];
  currentTable?: string;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
}
