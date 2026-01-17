// Tipos para mensagens do chat
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
  resultCount?: number;
}

// Tipos para estrutura de colunas da tabela
export interface Column {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'status' | 'boolean';
}

// Tipos para dados da tabela
export interface TableData {
  columns: Column[];
  rows: Record<string, unknown>[];
}

// Configuracao do grafico
export interface ChartConfig {
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
}

// Tipos para dados do grafico
export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: Record<string, unknown>[];
  config: ChartConfig;
}

// Tipos para historico de queries
export interface QueryHistory {
  id: string;
  question: string;
  sqlQuery: string;
  timestamp: Date;
  isFavorite: boolean;
}

// Tipos para opcoes de tabelas disponiveis
export interface TableOption {
  value: string;
  label: string;
  description: string;
}

// Tipos para resposta da API de chat
export interface ChatResponse {
  message: string;
  sqlQuery?: string;
  data?: Record<string, unknown>[];
  chartData?: ChartData;
  resultCount?: number;
  error?: string;
}

// Tipos para requisicao da API de chat
export interface ChatRequest {
  message: string;
  context?: {
    selectedTable?: string;
    previousMessages?: Message[];
  };
}

// Tipos para status de transacao/pedido
export type TransactionStatus = 'aprovado' | 'pendente' | 'cancelado' | 'processando';

// Tipos para intencao extraida da query
export type QueryIntent = 'count' | 'sum' | 'filter' | 'group' | 'sort' | 'show' | 'average' | 'compare';

// Tipos para range de tempo
export type TimeRange = 'hoje' | 'semana' | 'mes' | 'ano' | 'custom';

// Tipos para exportacao
export type ExportFormat = 'csv' | 'excel' | 'json';

// Tipos para sugestoes de perguntas
export interface QuestionSuggestion {
  text: string;
  category: 'vendas' | 'produtos' | 'clientes' | 'analise';
}

// Tipos para estado de loading
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Tipos para erro da aplicacao
export interface AppError {
  code: string;
  message: string;
  details?: string;
}

// Tipos para filtro de tabela
export interface TableFilter {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: unknown;
}

// Tipos para ordenacao de tabela
export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

// Tipos para paginacao
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
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

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
