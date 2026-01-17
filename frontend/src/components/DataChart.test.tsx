/**
 * Tests for DataChart Component
 * Tests chart rendering for different types, config options, and empty states
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataChart from './DataChart';
import type { ChartData } from '../types';

// ============================================
// Test Data
// ============================================
const mockBarChartData: ChartData = {
  type: 'bar',
  data: [
    { name: 'Janeiro', value: 1000, quantidade: 50 },
    { name: 'Fevereiro', value: 1500, quantidade: 75 },
    { name: 'Marco', value: 1200, quantidade: 60 },
  ],
  config: {
    title: 'Vendas por Mes',
    xAxisKey: 'name',
    yAxisKey: 'value',
    showLegend: true,
    showTooltip: true,
    showGrid: true,
  },
};

const mockLineChartData: ChartData = {
  type: 'line',
  data: [
    { mes: 'Jan', vendas: 100 },
    { mes: 'Fev', vendas: 150 },
    { mes: 'Mar', vendas: 120 },
    { mes: 'Abr', vendas: 180 },
  ],
  config: {
    title: 'Evolucao de Vendas',
    xAxisKey: 'mes',
    yAxisKey: 'vendas',
  },
};

const mockPieChartData: ChartData = {
  type: 'pie',
  data: [
    { name: 'Produto A', value: 400 },
    { name: 'Produto B', value: 300 },
    { name: 'Produto C', value: 200 },
    { name: 'Produto D', value: 100 },
  ],
  config: {
    title: 'Distribuicao por Produto',
    xAxisKey: 'name',
    yAxisKey: 'value',
  },
};

const mockAreaChartData: ChartData = {
  type: 'area',
  data: [
    { name: 'Semana 1', total: 500 },
    { name: 'Semana 2', total: 800 },
    { name: 'Semana 3', total: 1200 },
    { name: 'Semana 4', total: 1500 },
  ],
  config: {
    title: 'Total Acumulado',
    xAxisKey: 'name',
    yAxisKey: 'total',
  },
};

// ============================================
// DataChart Tests
// ============================================
describe('DataChart', () => {
  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should render bar chart with title', () => {
      render(<DataChart chartData={mockBarChartData} />);

      expect(screen.getByText('Vendas por Mes')).toBeInTheDocument();
    });

    it('should render line chart with title', () => {
      render(<DataChart chartData={mockLineChartData} />);

      expect(screen.getByText('Evolucao de Vendas')).toBeInTheDocument();
    });

    it('should render pie chart with title', () => {
      render(<DataChart chartData={mockPieChartData} />);

      expect(screen.getByText('Distribuicao por Produto')).toBeInTheDocument();
    });

    it('should render area chart with title', () => {
      render(<DataChart chartData={mockAreaChartData} />);

      expect(screen.getByText('Total Acumulado')).toBeInTheDocument();
    });

    it('should show data count in subtitle', () => {
      render(<DataChart chartData={mockBarChartData} />);

      expect(screen.getByText(/3 registro\(s\)/)).toBeInTheDocument();
    });
  });

  // ============================================
  // Empty State Tests
  // ============================================
  describe('Empty State', () => {
    it('should show empty state when chartData is null', () => {
      render(<DataChart chartData={null} />);

      expect(screen.getByText(/nenhum grafico para exibir/i)).toBeInTheDocument();
    });

    it('should show empty state when data array is empty', () => {
      const emptyChartData: ChartData = {
        type: 'bar',
        data: [],
        config: { title: 'Empty Chart' },
      };

      render(<DataChart chartData={emptyChartData} />);

      expect(screen.getByText(/nenhum grafico para exibir/i)).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      render(<DataChart chartData={null} />);

      expect(screen.getByText(/faca uma pergunta/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Close Button Tests
  // ============================================
  describe('Close Button', () => {
    it('should render close button when onClose is provided', () => {
      const onClose = vi.fn();
      render(<DataChart chartData={mockBarChartData} onClose={onClose} />);

      const closeButton = screen.getByLabelText(/fechar grafico/i);
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      render(<DataChart chartData={mockBarChartData} />);

      const closeButton = screen.queryByLabelText(/fechar grafico/i);
      expect(closeButton).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<DataChart chartData={mockBarChartData} onClose={onClose} />);

      const closeButton = screen.getByLabelText(/fechar grafico/i);
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // Config Tests
  // ============================================
  describe('Configuration', () => {
    it('should use default title when not provided', () => {
      const chartData: ChartData = {
        type: 'bar',
        data: [{ name: 'A', value: 100 }],
        config: {},
      };

      render(<DataChart chartData={chartData} />);

      expect(screen.getByText('Grafico')).toBeInTheDocument();
    });

    it('should use custom title from config', () => {
      render(<DataChart chartData={mockBarChartData} />);

      expect(screen.getByText('Vendas por Mes')).toBeInTheDocument();
    });
  });

  // ============================================
  // Chart Type Tests
  // ============================================
  describe('Chart Types', () => {
    it('should render bar chart container', () => {
      render(<DataChart chartData={mockBarChartData} />);

      // Check that the Recharts container is rendered
      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should render line chart container', () => {
      render(<DataChart chartData={mockLineChartData} />);

      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should render pie chart container', () => {
      render(<DataChart chartData={mockPieChartData} />);

      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should render area chart container', () => {
      render(<DataChart chartData={mockAreaChartData} />);

      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should default to bar chart for unknown type', () => {
      const unknownTypeData = {
        ...mockBarChartData,
        type: 'unknown' as any,
      };

      render(<DataChart chartData={unknownTypeData} />);

      // Should still render without error
      expect(screen.getByText('Vendas por Mes')).toBeInTheDocument();
    });
  });

  // ============================================
  // Card Structure Tests
  // ============================================
  describe('Card Structure', () => {
    it('should render in a card container', () => {
      render(<DataChart chartData={mockBarChartData} />);

      const card = document.querySelector('.card-static');
      expect(card).toBeInTheDocument();
    });

    it('should have a card header', () => {
      render(<DataChart chartData={mockBarChartData} />);

      const cardHeader = document.querySelector('.card-header');
      expect(cardHeader).toBeInTheDocument();
    });

    it('should have a card body', () => {
      render(<DataChart chartData={mockBarChartData} />);

      const cardBody = document.querySelector('.card-body');
      expect(cardBody).toBeInTheDocument();
    });

    it('should display chart icon in header', () => {
      render(<DataChart chartData={mockBarChartData} />);

      // The BarChart3 icon should be present (might have different class name format)
      const icon = document.querySelector('svg[class*="bar-chart"]') ||
                   document.querySelector('.card-header svg');
      expect(icon).toBeTruthy();
    });
  });

  // ============================================
  // Multiple Data Keys Tests
  // ============================================
  describe('Multiple Data Keys', () => {
    it('should handle charts with multiple data keys', () => {
      // mockBarChartData has 'value' and 'quantidade' keys
      render(<DataChart chartData={mockBarChartData} />);

      // Chart should render successfully
      expect(screen.getByText('Vendas por Mes')).toBeInTheDocument();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      const onClose = vi.fn();
      render(<DataChart chartData={mockBarChartData} onClose={onClose} />);

      const closeButton = screen.getByLabelText(/fechar grafico/i);
      expect(closeButton).toHaveAttribute('aria-label');
    });

    it('should have proper heading for chart title', () => {
      render(<DataChart chartData={mockBarChartData} />);

      const heading = screen.getByText('Vendas por Mes');
      expect(heading.className).toContain('font-semibold');
    });
  });
});
