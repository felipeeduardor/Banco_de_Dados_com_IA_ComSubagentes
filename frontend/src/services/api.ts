import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ChatRequest, ChatResponse, TableData, Column } from '../types';

// Configuracao base do axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Storage key for access token
const ACCESS_TOKEN_KEY = 'propia_access_token';

// Instancia do axios configurada
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticacao
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Erro de resposta do servidor
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown>;

      switch (status) {
        case 400:
          throw new Error(data.message as string || 'Requisicao invalida');
        case 401:
          throw new Error('Nao autorizado');
        case 403:
          throw new Error('Acesso negado');
        case 404:
          throw new Error('Recurso nao encontrado');
        case 500:
          throw new Error('Erro interno do servidor');
        default:
          throw new Error(data.message as string || 'Erro desconhecido');
      }
    } else if (error.request) {
      // Erro de conexao
      throw new Error('Nao foi possivel conectar ao servidor. Verifique sua conexao.');
    } else {
      throw new Error('Erro ao processar requisicao');
    }
  }
);

// Interface para contexto de mensagem
interface MessageContext {
  selectedTable?: string;
  previousMessages?: Array<{ role: string; content: string }>;
}

/**
 * Envia uma mensagem para o chat e recebe a resposta da IA
 */
export async function sendMessage(
  message: string,
  context?: MessageContext
): Promise<ChatResponse> {
  const request = {
    message,
    context: context ? {
      tableName: context.selectedTable,
      conversationHistory: context.previousMessages?.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(),
      })),
    } : undefined,
  };

  const response = await apiClient.post<{ success: boolean; data: ChatResponse; timestamp: string }>('/api/chat', request);
  return response.data.data;
}

/**
 * Obtem dados de uma tabela especifica
 */
export async function getTableData(tableName: string): Promise<TableData> {
  const response = await apiClient.get<{
    columns: Column[];
    rows: Record<string, unknown>[];
  }>(`/api/tables/${tableName}`);

  return {
    columns: response.data.columns,
    rows: response.data.rows,
  };
}

/**
 * Lista todas as tabelas disponiveis
 */
export async function getAvailableTables(): Promise<string[]> {
  const response = await apiClient.get<{ tables: string[] }>('/api/tables');
  return response.data.tables;
}

/**
 * Executa uma query SQL customizada (modo avancado)
 */
export async function executeQuery(sql: string): Promise<TableData> {
  const response = await apiClient.post<{
    columns: Column[];
    rows: Record<string, unknown>[];
  }>('/api/query', { sql });

  return {
    columns: response.data.columns,
    rows: response.data.rows,
  };
}

/**
 * Exporta dados em formato especifico
 */
export async function exportData(
  tableName: string,
  format: 'csv' | 'excel' | 'json'
): Promise<Blob> {
  const response = await apiClient.get(`/api/export/${tableName}`, {
    params: { format },
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Obtem estatisticas gerais do dashboard
 */
export async function getDashboardStats(): Promise<{
  totalTransactions: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}> {
  const response = await apiClient.get('/api/stats');
  return response.data;
}

/**
 * Salva uma query no historico de favoritos
 */
export async function saveQueryToFavorites(
  question: string,
  sqlQuery: string
): Promise<{ id: string }> {
  const response = await apiClient.post('/api/favorites', {
    question,
    sqlQuery,
  });
  return response.data;
}

/**
 * Remove uma query dos favoritos
 */
export async function removeFromFavorites(id: string): Promise<void> {
  await apiClient.delete(`/api/favorites/${id}`);
}

/**
 * Obtem o historico de queries
 */
export async function getQueryHistory(): Promise<Array<{
  id: string;
  question: string;
  sqlQuery: string;
  timestamp: string;
  isFavorite: boolean;
}>> {
  const response = await apiClient.get('/api/history');
  return response.data;
}

/**
 * Health check da API
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await apiClient.get('/api/health');
  return response.data;
}

// Exporta a instancia do axios para uso customizado
export { apiClient };

// Exporta tipos uteis
export type { MessageContext };
