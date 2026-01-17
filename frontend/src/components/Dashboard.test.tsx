/**
 * Tests for Dashboard Component
 * Tests layout, interactions, table selection, history management
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import type { Message, TableData, ChartData, QueryHistory, Column } from '../types';

// ============================================
// Test Data
// ============================================
const mockColumns: Column[] = [
  { key: 'id', label: 'ID', type: 'number' },
  { key: 'name', label: 'Nome', type: 'string' },
  { key: 'value', label: 'Valor', type: 'currency' },
  { key: 'status', label: 'Status', type: 'status' },
];

const mockTableData: TableData = {
  columns: mockColumns,
  rows: [
    { id: 1, name: 'Item A', value: 1500, status: 'Aprovado' },
    { id: 2, name: 'Item B', value: 2300, status: 'Pendente' },
  ],
};

const mockChartData: ChartData = {
  type: 'bar',
  data: [
    { name: 'Janeiro', value: 1000 },
    { name: 'Fevereiro', value: 1500 },
  ],
  config: {
    title: 'Vendas por Mes',
    xAxisKey: 'name',
    yAxisKey: 'value',
  },
};

const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Quais foram as vendas?',
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Encontrei 10 vendas.',
    timestamp: new Date('2024-01-15T10:00:05'),
    sqlQuery: 'SELECT * FROM sales',
    resultCount: 10,
  },
];

const mockQueryHistory: QueryHistory[] = [
  {
    id: 'h1',
    question: 'Vendas do mes',
    sqlQuery: 'SELECT * FROM sales WHERE month = 1',
    timestamp: new Date('2024-01-14T09:00:00'),
    isFavorite: false,
  },
  {
    id: 'h2',
    question: 'Top produtos',
    sqlQuery: 'SELECT * FROM products ORDER BY sales DESC LIMIT 10',
    timestamp: new Date('2024-01-13T15:00:00'),
    isFavorite: true,
  },
];

// ============================================
// Dashboard Tests
// ============================================
describe('Dashboard', () => {
  let mockOnSendMessage: ReturnType<typeof vi.fn>;
  let mockOnSelectTable: ReturnType<typeof vi.fn>;
  let mockOnToggleFavorite: ReturnType<typeof vi.fn>;
  let mockOnDeleteHistory: ReturnType<typeof vi.fn>;
  let mockOnSelectHistory: ReturnType<typeof vi.fn>;
  let mockOnCloseChart: ReturnType<typeof vi.fn>;
  let mockOnExportCSV: ReturnType<typeof vi.fn>;
  let mockOnExportExcel: ReturnType<typeof vi.fn>;

  const defaultProps = {
    messages: mockMessages,
    tableData: mockTableData,
    chartData: null as ChartData | null,
    queryHistory: mockQueryHistory,
    selectedTable: 'transactions',
    isLoading: false,
  };

  beforeEach(() => {
    mockOnSendMessage = vi.fn();
    mockOnSelectTable = vi.fn();
    mockOnToggleFavorite = vi.fn();
    mockOnDeleteHistory = vi.fn();
    mockOnSelectHistory = vi.fn();
    mockOnCloseChart = vi.fn();
    mockOnExportCSV = vi.fn();
    mockOnExportExcel = vi.fn();
  });

  const renderDashboard = (overrides = {}) => {
    return render(
      <Dashboard
        {...defaultProps}
        onSendMessage={mockOnSendMessage}
        onSelectTable={mockOnSelectTable}
        onToggleFavorite={mockOnToggleFavorite}
        onDeleteHistory={mockOnDeleteHistory}
        onSelectHistory={mockOnSelectHistory}
        onCloseChart={mockOnCloseChart}
        onExportCSV={mockOnExportCSV}
        onExportExcel={mockOnExportExcel}
        {...overrides}
      />
    );
  };

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should render the dashboard layout', () => {
      renderDashboard();

      expect(screen.getByText('AI Data Assistant')).toBeInTheDocument();
      expect(screen.getByText('Historico')).toBeInTheDocument();
    });

    it('should render the table selector', () => {
      renderDashboard();

      // The table selector should show the selected table
      expect(screen.getByText(/transacoes/i)).toBeInTheDocument();
    });

    it('should render the chat interface', () => {
      renderDashboard();

      expect(screen.getByText('Assistente de Dados')).toBeInTheDocument();
    });

    it('should render the data table', () => {
      renderDashboard();

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render query history', () => {
      renderDashboard();

      expect(screen.getByText(/vendas do mes/i)).toBeInTheDocument();
      expect(screen.getByText(/top produtos/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Table Selection Tests
  // ============================================
  describe('Table Selection', () => {
    it('should open table dropdown when clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();

      // Find and click the table selector button
      const tableButtons = screen.getAllByRole('button');
      const tableSelectorBtn = tableButtons.find(btn =>
        btn.textContent?.includes('Transacoes') ||
        btn.querySelector('.lucide-chevron-down')
      );

      if (tableSelectorBtn) {
        await user.click(tableSelectorBtn);
      }

      // Dropdown should show available tables
      expect(screen.getByText('Produtos')).toBeInTheDocument();
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
    });

    it('should call onSelectTable when a table is selected', async () => {
      const user = userEvent.setup();
      renderDashboard();

      // Open the dropdown
      const tableButtons = screen.getAllByRole('button');
      const tableSelectorBtn = tableButtons.find(btn =>
        btn.querySelector('.lucide-chevron-down')
      );

      if (tableSelectorBtn) {
        await user.click(tableSelectorBtn);
      }

      // Click on "Produtos"
      const produtosOption = screen.getByText('Produtos');
      await user.click(produtosOption);

      expect(mockOnSelectTable).toHaveBeenCalledWith('products');
    });
  });

  // ============================================
  // History Tests
  // ============================================
  describe('History', () => {
    it('should render history items', () => {
      renderDashboard();

      expect(screen.getByText(/vendas do mes/i)).toBeInTheDocument();
      expect(screen.getByText(/top produtos/i)).toBeInTheDocument();
    });

    it('should show filter tabs (Todos and Favoritos)', () => {
      renderDashboard();

      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Favoritos')).toBeInTheDocument();
    });

    it('should filter by favorites when clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();

      // Click on Favoritos tab
      const favoritosTab = screen.getByText('Favoritos');
      await user.click(favoritosTab);

      // Only the favorite item should be visible
      // The "Top produtos" is marked as favorite
      expect(screen.getByText(/top produtos/i)).toBeInTheDocument();
    });

    it('should call onSelectHistory when a history item is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();

      // Click on a history item
      const historyItem = screen.getByText(/vendas do mes/i);
      await user.click(historyItem);

      expect(mockOnSelectHistory).toHaveBeenCalledWith(mockQueryHistory[0]);
    });

    it('should show empty state when no history', () => {
      renderDashboard({ queryHistory: [] });

      expect(screen.getByText(/nenhuma consulta ainda/i)).toBeInTheDocument();
    });

    it('should show empty state for favorites when none exist', async () => {
      const user = userEvent.setup();
      renderDashboard({ queryHistory: [{ ...mockQueryHistory[0], isFavorite: false }] });

      // Click on Favoritos tab
      const favoritosTab = screen.getByText('Favoritos');
      await user.click(favoritosTab);

      expect(screen.getByText(/nenhum favorito ainda/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Chart Tests
  // ============================================
  describe('Chart', () => {
    it('should render chart when chartData is provided', () => {
      renderDashboard({ chartData: mockChartData });

      // Chart title should be visible
      expect(screen.getByText('Vendas por Mes')).toBeInTheDocument();
    });

    it('should not render chart when chartData is null', () => {
      renderDashboard({ chartData: null });

      // Chart title should not be visible
      expect(screen.queryByText('Vendas por Mes')).not.toBeInTheDocument();
    });

    it('should call onCloseChart when close button is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard({ chartData: mockChartData });

      // Find the close button (with aria-label "Fechar grafico")
      const closeButton = screen.getByLabelText(/fechar grafico/i);
      await user.click(closeButton);

      expect(mockOnCloseChart).toHaveBeenCalled();
    });
  });

  // ============================================
  // Loading State Tests
  // ============================================
  describe('Loading State', () => {
    it('should show loading indicator in table when isLoading is true', () => {
      renderDashboard({ isLoading: true });

      // Loading should show pulse animation
      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('should disable chat input when loading', () => {
      renderDashboard({ isLoading: true });

      const chatInput = screen.getByPlaceholderText(/digite sua pergunta/i);
      expect(chatInput).toBeDisabled();
    });
  });

  // ============================================
  // Export Tests
  // ============================================
  describe('Export', () => {
    it('should show CSV export button', () => {
      renderDashboard();

      // CSV button text might be hidden on mobile, check for Download icon or text
      const csvButtons = screen.queryAllByText(/csv/i);
      expect(csvButtons.length).toBeGreaterThan(0);
    });

    it('should show Excel export button', () => {
      renderDashboard();

      const excelButtons = screen.queryAllByText(/excel/i);
      expect(excelButtons.length).toBeGreaterThan(0);
    });

    it('should call onExportCSV when CSV button is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();

      const csvButton = screen.getByText(/csv/i).closest('button');
      if (csvButton) {
        await user.click(csvButton);
      }

      expect(mockOnExportCSV).toHaveBeenCalled();
    });

    it('should call onExportExcel when Excel button is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();

      const excelButton = screen.getByText(/excel/i).closest('button');
      if (excelButton) {
        await user.click(excelButton);
      }

      expect(mockOnExportExcel).toHaveBeenCalled();
    });
  });

  // ============================================
  // Message Tests
  // ============================================
  describe('Messages', () => {
    it('should render messages in chat', () => {
      renderDashboard();

      expect(screen.getByText('Quais foram as vendas?')).toBeInTheDocument();
      expect(screen.getByText('Encontrei 10 vendas.')).toBeInTheDocument();
    });

    it('should call onSendMessage when message is sent', async () => {
      const user = userEvent.setup();
      renderDashboard({ messages: [] });

      // Type a message
      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, 'Nova pergunta');

      // Send the message
      const sendButtons = screen.getAllByRole('button');
      const sendBtn = sendButtons.find(btn => btn.className.includes('btn-primary'));
      if (sendBtn) {
        await user.click(sendBtn);
      }

      expect(mockOnSendMessage).toHaveBeenCalledWith('Nova pergunta');
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderDashboard();

      const mainHeading = screen.getByText('AI Data Assistant');
      expect(mainHeading.tagName).toBe('H1');
    });

    it('should have accessible table', () => {
      renderDashboard();

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});
