import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import type { Message, TableData, ChartData, QueryHistory, Column } from './types';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChartsPage from './pages/ChartsPage';
import { useAuth } from './contexts/AuthContext';
import { useChartContext } from './contexts/ChartContext';
import { sendMessage, getTableData } from './services/api';
import { generateId, detectChartRequest, suggestChartType } from './utils/queryParser';

// Storage key for dark mode preference
const DARK_MODE_KEY = 'propia_dark_mode';

// Dados mockados para desenvolvimento
const MOCK_COLUMNS: Record<string, Column[]> = {
  transactions: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'date', label: 'Data', type: 'date' },
    { key: 'customer', label: 'Cliente', type: 'string' },
    { key: 'product', label: 'Produto', type: 'string' },
    { key: 'value', label: 'Valor', type: 'currency' },
    { key: 'status', label: 'Status', type: 'status' },
  ],
  products: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'name', label: 'Nome', type: 'string' },
    { key: 'category', label: 'Categoria', type: 'string' },
    { key: 'price', label: 'Preco', type: 'currency' },
    { key: 'stock', label: 'Estoque', type: 'number' },
    { key: 'status', label: 'Status', type: 'status' },
  ],
  customers: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'name', label: 'Nome', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'phone', label: 'Telefone', type: 'string' },
    { key: 'registeredAt', label: 'Cadastro', type: 'date' },
    { key: 'status', label: 'Status', type: 'status' },
  ],
  orders: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'date', label: 'Data', type: 'date' },
    { key: 'customer', label: 'Cliente', type: 'string' },
    { key: 'items', label: 'Itens', type: 'number' },
    { key: 'total', label: 'Total', type: 'currency' },
    { key: 'status', label: 'Status', type: 'status' },
  ],
};

// Dados mockados para desenvolvimento
const generateMockData = (table: string): Record<string, unknown>[] => {
  const statuses = ['aprovado', 'pendente', 'cancelado', 'processando'];
  const customerNames = ['Joao Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Ferreira'];
  const productNames = ['Curso de React', 'Curso de Python', 'Mentoria Full Stack', 'E-book Marketing', 'Workshop DevOps'];
  const categories = ['Desenvolvimento', 'Marketing', 'Design', 'Negocios', 'Data Science'];

  const rows: Record<string, unknown>[] = [];
  const count = Math.floor(Math.random() * 20) + 10;

  for (let i = 0; i < count; i++) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30));

    switch (table) {
      case 'transactions':
        rows.push({
          id: `TRX-${String(i + 1).padStart(4, '0')}`,
          date: baseDate.toISOString(),
          customer: customerNames[Math.floor(Math.random() * customerNames.length)],
          product: productNames[Math.floor(Math.random() * productNames.length)],
          value: Math.floor(Math.random() * 5000) + 100,
          status: statuses[Math.floor(Math.random() * statuses.length)],
        });
        break;
      case 'products':
        rows.push({
          id: `PRD-${String(i + 1).padStart(4, '0')}`,
          name: productNames[i % productNames.length],
          category: categories[Math.floor(Math.random() * categories.length)],
          price: Math.floor(Math.random() * 2000) + 50,
          stock: Math.floor(Math.random() * 100),
          status: Math.random() > 0.2 ? 'ativo' : 'inativo',
        });
        break;
      case 'customers':
        rows.push({
          id: `CLI-${String(i + 1).padStart(4, '0')}`,
          name: customerNames[i % customerNames.length],
          email: `cliente${i + 1}@email.com`,
          phone: `(11) 9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          registeredAt: baseDate.toISOString(),
          status: Math.random() > 0.1 ? 'ativo' : 'inativo',
        });
        break;
      case 'orders':
        rows.push({
          id: `ORD-${String(i + 1).padStart(4, '0')}`,
          date: baseDate.toISOString(),
          customer: customerNames[Math.floor(Math.random() * customerNames.length)],
          items: Math.floor(Math.random() * 5) + 1,
          total: Math.floor(Math.random() * 10000) + 200,
          status: statuses[Math.floor(Math.random() * statuses.length)],
        });
        break;
    }
  }

  return rows;
};

export default function App() {
  // Auth context
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Chart context for sharing charts between pages
  const { addQueryChart } = useChartContext();

  // Navigation
  const navigate = useNavigate();

  // Auth page state
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) return stored === 'true';
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Estados principais
  const [messages, setMessages] = useState<Message[]>([]);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [selectedTable, setSelectedTable] = useState('transactions');

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
    // Also update document class for global dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toggle dark mode
  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Carrega dados iniciais da tabela selecionada
  useEffect(() => {
    if (isAuthenticated) {
      loadTableData(selectedTable);
    }
  }, [selectedTable, isAuthenticated]);

  // Funcao para carregar dados da tabela
  const loadTableData = useCallback(async (tableName: string) => {
    setIsLoading(true);
    try {
      // Tenta buscar da API
      const data = await getTableData(tableName);
      setTableData(data);
    } catch {
      // Fallback para dados mockados em desenvolvimento
      console.log('Usando dados mockados para desenvolvimento');
      setTableData({
        columns: MOCK_COLUMNS[tableName] || [],
        rows: generateMockData(tableName),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler para enviar mensagem
  const handleSendMessage = useCallback(
    async (content: string) => {
      // Cria mensagem do usuario
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Envia para a API
        const response = await sendMessage(content, {
          selectedTable,
          previousMessages: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        // Cria mensagem do assistente
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          sqlQuery: response.sqlQuery,
          resultCount: response.resultCount,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Atualiza dados da tabela se houver
        if (response.data && response.data.length > 0) {
          // Infere colunas dos dados
          const inferredColumns: Column[] = Object.keys(response.data[0]).map((key) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            type: inferColumnType(response.data![0][key]),
          }));

          setTableData({
            columns: inferredColumns,
            rows: response.data,
          });
        }

        // Atualiza grafico se houver e navega para pagina de graficos
        if (response.chartData) {
          setChartData(response.chartData);
          // Adiciona ao contexto de graficos e navega
          addQueryChart({
            chartData: response.chartData,
            query: content,
            timestamp: new Date(),
            data: response.data,
          });
          navigate('/charts');
        } else if (detectChartRequest(content) && response.data) {
          // Gera grafico automaticamente se solicitado
          const chartType = suggestChartType(content);
          const generatedChart = {
            type: chartType,
            data: response.data.slice(0, 10),
            config: {
              title: 'Resultado da Consulta',
              showLegend: true,
              showTooltip: true,
            },
          };
          setChartData(generatedChart);
          // Adiciona ao contexto e navega
          addQueryChart({
            chartData: generatedChart,
            query: content,
            timestamp: new Date(),
            data: response.data,
          });
          navigate('/charts');
        }

        // Adiciona ao historico
        if (response.sqlQuery) {
          const historyItem: QueryHistory = {
            id: generateId(),
            question: content,
            sqlQuery: response.sqlQuery,
            timestamp: new Date(),
            isFavorite: false,
          };
          setQueryHistory((prev) => [historyItem, ...prev].slice(0, 50));
        }
      } catch (error) {
        // Mensagem de erro
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Desculpe, ocorreu um erro ao processar sua pergunta. ${
            error instanceof Error ? error.message : 'Tente novamente.'
          }`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTable, messages]
  );

  // Infere o tipo da coluna pelo valor
  const inferColumnType = (value: unknown): Column['type'] => {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'number') {
      // Verifica se parece ser moeda
      if (value > 10 && value < 1000000) return 'currency';
      return 'number';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      // Verifica se e data
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      // Verifica se e status
      if (['aprovado', 'pendente', 'cancelado', 'ativo', 'inativo', 'processando'].includes(value.toLowerCase())) {
        return 'status';
      }
    }
    return 'string';
  };

  // Handler para selecionar tabela
  const handleSelectTable = useCallback((table: string) => {
    setSelectedTable(table);
    setChartData(null);
  }, []);

  // Handler para toggle favorito
  const handleToggleFavorite = useCallback((id: string) => {
    setQueryHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  }, []);

  // Handler para deletar do historico
  const handleDeleteHistory = useCallback((id: string) => {
    setQueryHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Handler para selecionar item do historico
  const handleSelectHistory = useCallback(
    (history: QueryHistory) => {
      handleSendMessage(history.question);
    },
    [handleSendMessage]
  );

  // Handler para fechar grafico
  const handleCloseChart = useCallback(() => {
    setChartData(null);
  }, []);

  // Handler para exportar CSV
  const handleExportCSV = useCallback(() => {
    if (!tableData || !tableData.rows.length) return;

    const headers = tableData.columns.map((col) => col.label).join(',');
    const rows = tableData.rows
      .map((row) =>
        tableData.columns
          .map((col) => {
            const value = row[col.key];
            // Escapa valores com virgula
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value ?? '';
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tableData, selectedTable]);

  // Handler para exportar Excel (na verdade CSV com extensao xlsx)
  const handleExportExcel = useCallback(() => {
    if (!tableData || !tableData.rows.length) return;

    const headers = tableData.columns.map((col) => col.label).join('\t');
    const rows = tableData.rows
      .map((row) =>
        tableData.columns.map((col) => row[col.key] ?? '').join('\t')
      )
      .join('\n');

    const tsv = `${headers}\n${rows}`;
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tableData, selectedTable]);

  // Loading state during auth check
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Not authenticated - show login or register page
  if (!isAuthenticated) {
    if (authPage === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthPage('register')} />;
  }

  // Authenticated - show dashboard with routes
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            messages={messages}
            tableData={tableData}
            chartData={chartData}
            queryHistory={queryHistory}
            selectedTable={selectedTable}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            onSendMessage={handleSendMessage}
            onSelectTable={handleSelectTable}
            onToggleFavorite={handleToggleFavorite}
            onDeleteHistory={handleDeleteHistory}
            onSelectHistory={handleSelectHistory}
            onCloseChart={handleCloseChart}
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onToggleDarkMode={handleToggleDarkMode}
          />
        }
      />
      <Route path="/charts" element={<ChartsPage isDarkMode={isDarkMode} />} />
    </Routes>
  );
}
