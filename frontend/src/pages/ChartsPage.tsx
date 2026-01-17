import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  RefreshCw,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { getTableData } from '../services/api';
import { useChartContext } from '../contexts/ChartContext';

// Cores para os graficos
const CHART_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
];

interface Transaction {
  id: number;
  date: string;
  amount: number;
  status: string;
  customer: string;
  product: string;
}

interface ChartsPageProps {
  isDarkMode?: boolean;
}

export default function ChartsPage({ isDarkMode = false }: ChartsPageProps) {
  const navigate = useNavigate();
  const { queryCharts, lastQueryChart } = useChartContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados das transacoes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getTableData('transactions');
        if (data?.rows) {
          setTransactions(data.rows as unknown as Transaction[]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // KPIs calculados
  const kpis = useMemo(() => {
    const approved = transactions.filter(t => t.status === 'Aprovado');
    const totalRevenue = approved.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = approved.length > 0 ? totalRevenue / approved.length : 0;
    const uniqueCustomers = new Set(transactions.map(t => t.customer)).size;
    const uniqueProducts = new Set(transactions.map(t => t.product)).size;

    return {
      totalRevenue,
      totalTransactions: transactions.length,
      approvedTransactions: approved.length,
      avgTicket,
      uniqueCustomers,
      uniqueProducts,
    };
  }, [transactions]);

  // Dados: Vendas por Produto
  const salesByProduct = useMemo(() => {
    const grouped = transactions
      .filter(t => t.status === 'Aprovado')
      .reduce((acc, t) => {
        acc[t.product] = (acc[t.product] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([product, total]) => ({ product, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [transactions]);

  // Dados: Contagem por Status
  const statusDistribution = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  }, [transactions]);

  // Dados: Vendas por Mes
  const salesByMonth = useMemo(() => {
    const grouped = transactions
      .filter(t => t.status === 'Aprovado')
      .reduce((acc, t) => {
        const month = t.date.substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([month, total]) => ({
        month: formatMonth(month),
        total,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // Dados: Top Clientes
  const topCustomers = useMemo(() => {
    const grouped = transactions
      .filter(t => t.status === 'Aprovado')
      .reduce((acc, t) => {
        acc[t.customer] = (acc[t.customer] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([customer, total]) => ({ customer, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions]);

  // Dados: Quantidade de vendas por produto
  const productCount = useMemo(() => {
    const grouped = transactions
      .filter(t => t.status === 'Aprovado')
      .reduce((acc, t) => {
        acc[t.product] = (acc[t.product] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [transactions]);

  // Formata mes
  function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
  }

  // Formata moeda
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className={textMutedClass}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className={`w-6 h-6 ${textClass}`} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Dashboard de Graficos</h1>
              <p className={textMutedClass}>Visualizacao completa dos dados de vendas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${textMutedClass}`}>Receita Total</p>
              <p className={`text-xl font-bold ${textClass}`}>{formatCurrency(kpis.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className={`text-sm ${textMutedClass}`}>Transacoes</p>
              <p className={`text-xl font-bold ${textClass}`}>{kpis.approvedTransactions}/{kpis.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className={`text-sm ${textMutedClass}`}>Clientes</p>
              <p className={`text-xl font-bold ${textClass}`}>{kpis.uniqueCustomers}</p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className={`text-sm ${textMutedClass}`}>Ticket Medio</p>
              <p className={`text-xl font-bold ${textClass}`}>{formatCurrency(kpis.avgTicket)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafico da Ultima Consulta IA */}
      {lastQueryChart && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className={`${cardClass} border rounded-xl p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${textClass}`}>Resultado da Consulta IA</h3>
                <p className={`text-sm ${textMutedClass}`}>
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  "{lastQueryChart.query}"
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              {lastQueryChart.chartData.type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={lastQueryChart.chartData.data}
                    dataKey={Object.keys(lastQueryChart.chartData.data[0] || {}).find(k => typeof lastQueryChart.chartData.data[0][k] === 'number') || 'value'}
                    nameKey={Object.keys(lastQueryChart.chartData.data[0] || {}).find(k => typeof lastQueryChart.chartData.data[0][k] === 'string') || 'name'}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    label
                  >
                    {lastQueryChart.chartData.data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : lastQueryChart.chartData.type === 'line' ? (
                <LineChart data={lastQueryChart.chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey={Object.keys(lastQueryChart.chartData.data[0] || {}).find(k => typeof lastQueryChart.chartData.data[0][k] === 'string') || 'name'} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(lastQueryChart.chartData.data[0] || {}).filter(k => typeof lastQueryChart.chartData.data[0][k] === 'number').map((key, index) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={lastQueryChart.chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey={Object.keys(lastQueryChart.chartData.data[0] || {}).find(k => typeof lastQueryChart.chartData.data[0][k] === 'string') || 'name'} tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(lastQueryChart.chartData.data[0] || {}).filter(k => typeof lastQueryChart.chartData.data[0][k] === 'number').map((key, index) => (
                    <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por Produto */}
        <div className={`${cardClass} border rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className={`font-semibold ${textClass}`}>Receita por Produto</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
              <YAxis dataKey="product" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuicao por Status */}
        <div className={`${cardClass} border rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
            <h3 className={`font-semibold ${textClass}`}>Distribuicao por Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vendas por Mes */}
        <div className={`${cardClass} border rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className={`font-semibold ${textClass}`}>Evolucao de Vendas por Mes</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesByMonth}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="total" stroke="#4F46E5" fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clientes */}
        <div className={`${cardClass} border rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className={`font-semibold ${textClass}`}>Top Clientes por Receita</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
              <YAxis dataKey="customer" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quantidade de Vendas por Produto */}
        <div className={`${cardClass} border rounded-xl p-6 lg:col-span-2`}>
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-indigo-600" />
            <h3 className={`font-semibold ${textClass}`}>Quantidade de Vendas por Produto</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productCount}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="product" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                {productCount.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
