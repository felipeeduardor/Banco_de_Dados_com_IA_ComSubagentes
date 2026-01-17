import React, { useMemo } from 'react';
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
import { X, BarChart3 } from 'lucide-react';
import type { ChartData } from '../types';
import { formatCurrency, formatNumber } from '../utils/queryParser';

interface DataChartProps {
  chartData: ChartData | null;
  onClose?: () => void;
}

// Cores personalizadas para os graficos
const CHART_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
];

// Gradientes para graficos de area
const GRADIENT_COLORS = {
  primary: { start: '#4F46E5', end: '#818CF8' },
  success: { start: '#10B981', end: '#6EE7B7' },
};

export default function DataChart({ chartData, onClose }: DataChartProps) {
  // Processa os dados do grafico
  const processedData = useMemo(() => {
    if (!chartData?.data) return [];
    return chartData.data;
  }, [chartData?.data]);

  // Configuracoes do grafico
  const config = useMemo(() => {
    return {
      title: chartData?.config?.title || 'Grafico',
      xAxisKey: chartData?.config?.xAxisKey || 'name',
      yAxisKey: chartData?.config?.yAxisKey || 'value',
      colors: chartData?.config?.colors || CHART_COLORS,
      showLegend: chartData?.config?.showLegend ?? true,
      showTooltip: chartData?.config?.showTooltip ?? true,
      showGrid: chartData?.config?.showGrid ?? true,
    };
  }, [chartData?.config]);

  // Formata valores para o tooltip
  const formatTooltipValue = (value: number, name: string): [string, string] => {
    // Detecta se e valor monetario pelo nome
    const isCurrency = name.toLowerCase().includes('valor') ||
                       name.toLowerCase().includes('faturamento') ||
                       name.toLowerCase().includes('receita') ||
                       name.toLowerCase().includes('total');

    if (isCurrency) {
      return [formatCurrency(value), name];
    }
    return [formatNumber(value), name];
  };

  // Componente de tooltip customizado
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => {
          const [formattedValue, formattedName] = formatTooltipValue(entry.value, entry.name);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{formattedName}:</span>
              <span className="font-medium text-gray-900">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderiza grafico de barras
  const renderBarChart = () => {
    const dataKeys = Object.keys(processedData[0] || {}).filter(
      (key) => key !== config.xAxisKey
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis
            dataKey={config.xAxisKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
            />
          )}
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={config.colors[index % config.colors.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Renderiza grafico de linha
  const renderLineChart = () => {
    const dataKeys = Object.keys(processedData[0] || {}).filter(
      (key) => key !== config.xAxisKey
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis
            dataKey={config.xAxisKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
            />
          )}
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={config.colors[index % config.colors.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: config.colors[index % config.colors.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Renderiza grafico de pizza
  const renderPieChart = () => {
    const dataKey = config.yAxisKey;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={processedData}
            dataKey={dataKey}
            nameKey={config.xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={150}
            innerRadius={60}
            paddingAngle={2}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            labelLine={{ stroke: '#6B7280', strokeWidth: 1 }}
          >
            {processedData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={config.colors[index % config.colors.length]}
              />
            ))}
          </Pie>
          {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Renderiza grafico de area
  const renderAreaChart = () => {
    const dataKeys = Object.keys(processedData[0] || {}).filter(
      (key) => key !== config.xAxisKey
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {dataKeys.map((_, index) => (
              <linearGradient
                key={`gradient-${index}`}
                id={`colorGradient${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={config.colors[index % config.colors.length]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={config.colors[index % config.colors.length]}
                  stopOpacity={0.1}
                />
              </linearGradient>
            ))}
          </defs>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis
            dataKey={config.xAxisKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
            />
          )}
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={config.colors[index % config.colors.length]}
              strokeWidth={2}
              fill={`url(#colorGradient${index})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // Renderiza o grafico baseado no tipo
  const renderChart = () => {
    switch (chartData?.type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };

  // Estado vazio
  if (!chartData || !processedData.length) {
    return (
      <div className="card-static">
        <div className="empty-state py-16">
          <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum grafico para exibir
          </h3>
          <p className="text-gray-500 max-w-sm">
            Faca uma pergunta que gere visualizacao de dados ou solicite um
            grafico especifico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-static">
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.title}</h3>
            <p className="text-sm text-gray-500">
              {processedData.length} registro(s)
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Fechar grafico"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grafico */}
      <div className="card-body">
        {renderChart()}
      </div>
    </div>
  );
}
