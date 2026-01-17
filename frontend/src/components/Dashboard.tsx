import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  History,
  Star,
  StarOff,
  ChevronDown,
  Table,
  Users,
  ShoppingCart,
  Package,
  Trash2,
  Clock,
  Sparkles,
  Menu,
  X,
  Moon,
  Sun,
  BarChart3,
} from 'lucide-react';
import type { Message, TableData, ChartData, QueryHistory, TableOption } from '../types';
import DataTable from './DataTable';
import DataChart from './DataChart';
import ChatInterface from './ChatInterface';
import UserMenu from './UserMenu';
import { formatDateTime, truncateText } from '../utils/queryParser';

interface DashboardProps {
  messages: Message[];
  tableData: TableData | null;
  chartData: ChartData | null;
  queryHistory: QueryHistory[];
  selectedTable: string;
  isLoading: boolean;
  isDarkMode: boolean;
  onSendMessage: (message: string) => void;
  onSelectTable: (table: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onSelectHistory: (history: QueryHistory) => void;
  onCloseChart: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onToggleDarkMode: () => void;
}

// Tabelas disponiveis
const AVAILABLE_TABLES: TableOption[] = [
  {
    value: 'transactions',
    label: 'Transacoes',
    description: 'Historico de vendas e pagamentos',
  },
  {
    value: 'products',
    label: 'Produtos',
    description: 'Catalogo de produtos',
  },
  {
    value: 'customers',
    label: 'Clientes',
    description: 'Base de clientes',
  },
  {
    value: 'orders',
    label: 'Pedidos',
    description: 'Pedidos e entregas',
  },
];

// Icones para cada tabela
const TABLE_ICONS: Record<string, React.ReactNode> = {
  transactions: <ShoppingCart className="w-4 h-4" />,
  products: <Package className="w-4 h-4" />,
  customers: <Users className="w-4 h-4" />,
  orders: <Table className="w-4 h-4" />,
};

export default function Dashboard({
  messages,
  tableData,
  chartData,
  queryHistory,
  selectedTable,
  isLoading,
  isDarkMode,
  onSendMessage,
  onSelectTable,
  onToggleFavorite,
  onDeleteHistory,
  onSelectHistory,
  onCloseChart,
  onExportCSV,
  onExportExcel,
  onToggleDarkMode,
}: DashboardProps) {
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'favorites'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Filtra o historico
  const filteredHistory = queryHistory.filter((item) =>
    historyFilter === 'favorites' ? item.isFavorite : true
  );

  // Handler para selecionar tabela
  const handleTableSelect = useCallback(
    (table: string) => {
      onSelectTable(table);
      setShowTableDropdown(false);
    },
    [onSelectTable]
  );

  // Obtem info da tabela selecionada
  const selectedTableInfo = AVAILABLE_TABLES.find(
    (t) => t.value === selectedTable
  );

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between z-20`}>
        <div className="flex items-center gap-4">
          {/* Menu mobile */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>PropIA Delta</h1>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Consulte seus dados com IA</p>
            </div>
          </div>
        </div>

        {/* Centro - Seletor de tabela */}
        <div className="relative">
          <button
            onClick={() => setShowTableDropdown(!showTableDropdown)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {TABLE_ICONS[selectedTable]}
            <span className="hidden sm:inline">{selectedTableInfo?.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTableDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTableDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowTableDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 animate-fade-in">
                {AVAILABLE_TABLES.map((table) => (
                  <button
                    key={table.value}
                    onClick={() => handleTableSelect(table.value)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                      selectedTable === table.value ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedTable === table.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {TABLE_ICONS[table.value]}
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-medium ${
                          selectedTable === table.value
                            ? 'text-indigo-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {table.label}
                      </p>
                      <p className="text-xs text-gray-500">{table.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Direita - Charts, Dark mode toggle e User menu */}
        <div className="flex items-center gap-2">
          {/* Link para pagina de graficos */}
          <Link
            to="/charts"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            title="Ver graficos"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Graficos</span>
          </Link>

          {/* Toggle Dark Mode */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Toggle Chat (mobile) */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <UserMenu isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Historico */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-72 bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            flex flex-col
          `}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Historico</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden btn-icon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  historyFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setHistoryFilter('favorites')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  historyFilter === 'favorites'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star className="w-4 h-4" />
                Favoritos
              </button>
            </div>
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="empty-state py-8">
                <Clock className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  {historyFilter === 'favorites'
                    ? 'Nenhum favorito ainda'
                    : 'Nenhuma consulta ainda'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  onClick={() => onSelectHistory(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 font-medium line-clamp-2">
                      {truncateText(item.question, 60)}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className="p-1 hover:bg-white rounded"
                      >
                        {item.isFavorite ? (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistory(item.id);
                        }}
                        className="p-1 hover:bg-white rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Overlay para sidebar mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main area - Tabela e Grafico */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="space-y-6">
            {/* Grafico (se houver) */}
            {chartData && (
              <div className="animate-slide-in-up">
                <DataChart chartData={chartData} onClose={onCloseChart} />
              </div>
            )}

            {/* Tabela de dados */}
            <DataTable
              data={tableData}
              isLoading={isLoading}
              onExportCSV={onExportCSV}
              onExportExcel={onExportExcel}
            />
          </div>
        </main>

        {/* Chat panel */}
        <aside
          className={`
            fixed lg:static inset-y-0 right-0 z-30
            w-full sm:w-96 bg-gray-50 border-l border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Close button (mobile) */}
          <button
            onClick={() => setIsChatOpen(false)}
            className="absolute top-4 left-4 lg:hidden btn-icon bg-white shadow"
          >
            <X className="w-5 h-5" />
          </button>

          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
          />
        </aside>

        {/* Overlay para chat mobile */}
        {isChatOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
