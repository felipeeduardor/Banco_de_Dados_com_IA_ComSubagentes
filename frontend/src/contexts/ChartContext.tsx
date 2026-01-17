import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ChartData } from '../types';

interface QueryChartData {
  chartData: ChartData;
  query: string;
  timestamp: Date;
  data?: Record<string, unknown>[];
}

interface ChartContextType {
  queryCharts: QueryChartData[];
  addQueryChart: (chart: QueryChartData) => void;
  clearQueryCharts: () => void;
  lastQueryChart: QueryChartData | null;
}

const ChartContext = createContext<ChartContextType | null>(null);

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [queryCharts, setQueryCharts] = useState<QueryChartData[]>([]);

  const addQueryChart = useCallback((chart: QueryChartData) => {
    setQueryCharts(prev => [chart, ...prev].slice(0, 10)); // Keep last 10 charts
  }, []);

  const clearQueryCharts = useCallback(() => {
    setQueryCharts([]);
  }, []);

  const lastQueryChart = queryCharts.length > 0 ? queryCharts[0] : null;

  return (
    <ChartContext.Provider value={{ queryCharts, addQueryChart, clearQueryCharts, lastQueryChart }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChartContext() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartContext must be used within a ChartProvider');
  }
  return context;
}
