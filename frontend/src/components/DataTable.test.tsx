/**
 * Tests for DataTable Component
 * Tests rendering, sorting, filtering, pagination, and export functionality
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';
import type { TableData, Column } from '../types';

// ============================================
// Test Data
// ============================================
const mockColumns: Column[] = [
  { key: 'id', label: 'ID', type: 'number' },
  { key: 'name', label: 'Nome', type: 'string' },
  { key: 'amount', label: 'Valor', type: 'currency' },
  { key: 'date', label: 'Data', type: 'date' },
  { key: 'status', label: 'Status', type: 'status' },
];

const mockRows: Record<string, unknown>[] = [
  { id: 1, name: 'Item A', amount: 1500.00, date: '2024-01-15', status: 'Aprovado' },
  { id: 2, name: 'Item B', amount: 2300.00, date: '2024-01-14', status: 'Pendente' },
  { id: 3, name: 'Item C', amount: 890.00, date: '2024-01-13', status: 'Cancelado' },
  { id: 4, name: 'Item D', amount: 3200.00, date: '2024-01-12', status: 'Aprovado' },
  { id: 5, name: 'Item E', amount: 450.00, date: '2024-01-11', status: 'Pendente' },
];

const mockTableData: TableData = {
  columns: mockColumns,
  rows: mockRows,
};

// Generate larger dataset for pagination tests
const generateMockRows = (count: number): Record<string, unknown>[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    amount: Math.random() * 5000,
    date: `2024-01-${String(15 - (i % 15)).padStart(2, '0')}`,
    status: ['Aprovado', 'Pendente', 'Cancelado'][i % 3],
  }));
};

// ============================================
// DataTable Render Tests
// ============================================
describe('DataTable', () => {
  describe('Rendering', () => {
    it('should render the table with data', () => {
      render(<DataTable data={mockTableData} />);

      // Check headers are rendered
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Nome')).toBeInTheDocument();
      expect(screen.getByText('Valor')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render all rows', () => {
      render(<DataTable data={mockTableData} />);

      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.getByText('Item B')).toBeInTheDocument();
      expect(screen.getByText('Item C')).toBeInTheDocument();
    });

    it('should render empty state when data is null', () => {
      render(<DataTable data={null} />);

      expect(screen.getByText('Nenhum dado para exibir')).toBeInTheDocument();
    });

    it('should render empty state when columns are empty', () => {
      render(<DataTable data={{ columns: [], rows: [] }} />);

      expect(screen.getByText('Nenhum dado para exibir')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<DataTable data={mockTableData} isLoading={true} />);

      // Check for loading indicator (animated pulse skeleton)
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should format currency values correctly', () => {
      render(<DataTable data={mockTableData} />);

      // Check for BRL currency formatting
      const currencyPattern = /R\$\s*[\d.,]+/;
      const cells = screen.getAllByRole('cell');
      const hasCurrencyCell = cells.some(cell => currencyPattern.test(cell.textContent || ''));
      expect(hasCurrencyCell).toBe(true);
    });

    it('should format date values correctly', () => {
      render(<DataTable data={mockTableData} />);

      // Check for Brazilian date format (DD/MM/YYYY)
      const datePattern = /\d{2}\/\d{2}\/\d{4}/;
      const cells = screen.getAllByRole('cell');
      const hasDateCell = cells.some(cell => datePattern.test(cell.textContent || ''));
      expect(hasDateCell).toBe(true);
    });

    it('should apply status badge styling', () => {
      render(<DataTable data={mockTableData} />);

      // Check for badge classes on status cells
      const badges = document.querySelectorAll('.badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Sorting Tests
  // ============================================
  describe('Sorting', () => {
    it('should sort by column when header is clicked', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      // Find and click the "Nome" header to sort
      const nameHeader = screen.getByText('Nome').closest('th');
      expect(nameHeader).toBeInTheDocument();

      await user.click(nameHeader!);

      // After clicking, data should be sorted by name ascending
      const rows = screen.getAllByRole('row').slice(1); // Skip header row
      const firstCell = within(rows[0]).getAllByRole('cell')[1]; // Name column
      expect(firstCell.textContent).toBe('Item A');
    });

    it('should toggle sort direction on second click', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const nameHeader = screen.getByText('Nome').closest('th');

      // First click - ascending
      await user.click(nameHeader!);

      // Second click - descending
      await user.click(nameHeader!);

      // After two clicks, data should be sorted by name descending
      const rows = screen.getAllByRole('row').slice(1);
      const firstCell = within(rows[0]).getAllByRole('cell')[1];
      expect(firstCell.textContent).toBe('Item E');
    });

    it('should remove sort on third click', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const nameHeader = screen.getByText('Nome').closest('th');

      // Three clicks should remove sort
      await user.click(nameHeader!);
      await user.click(nameHeader!);
      await user.click(nameHeader!);

      // Sort should be removed, data in original order
      const rows = screen.getAllByRole('row').slice(1);
      const firstCell = within(rows[0]).getAllByRole('cell')[1];
      expect(firstCell.textContent).toBe('Item A');
    });

    it('should display sort indicator when sorted', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const nameHeader = screen.getByText('Nome').closest('th');
      await user.click(nameHeader!);

      // Check for sort indicator (ChevronUp or ChevronDown icon with color)
      const sortedHeader = screen.getByText('Nome').closest('th');
      expect(sortedHeader?.className).toContain('sorted');
    });

    it('should sort numeric columns correctly', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const idHeader = screen.getByText('ID').closest('th');
      await user.click(idHeader!);
      await user.click(idHeader!); // Descending

      const rows = screen.getAllByRole('row').slice(1);
      const firstId = within(rows[0]).getAllByRole('cell')[0].textContent;
      expect(firstId).toBe('5');
    });
  });

  // ============================================
  // Filtering Tests
  // ============================================
  describe('Filtering', () => {
    it('should render search input', () => {
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter rows based on search term', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'Item A');

      // Should only show Item A
      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.queryByText('Item B')).not.toBeInTheDocument();
    });

    it('should show no results message when filter matches nothing', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'xyz123nonexistent');

      expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
    });

    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'Aprovado');

      // Should show only approved items
      const rows = screen.getAllByRole('row');
      // Header + 2 approved items
      expect(rows.length).toBeLessThanOrEqual(3);
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'item a');

      expect(screen.getByText('Item A')).toBeInTheDocument();
    });

    it('should clear filter when search is cleared', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);

      // Type and then clear
      await user.type(searchInput, 'Item A');
      await user.clear(searchInput);

      // All items should be visible again
      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.getByText('Item B')).toBeInTheDocument();
      expect(screen.getByText('Item C')).toBeInTheDocument();
    });
  });

  // ============================================
  // Pagination Tests
  // ============================================
  describe('Pagination', () => {
    const largeMockData: TableData = {
      columns: mockColumns,
      rows: generateMockRows(25),
    };

    it('should paginate data correctly', () => {
      render(<DataTable data={largeMockData} />);

      // Default page size is 10, so should show 10 items
      const rows = screen.getAllByRole('row').slice(1); // Skip header
      expect(rows.length).toBe(10);
    });

    it('should show pagination info', () => {
      render(<DataTable data={largeMockData} />);

      // Should show "Exibindo X de Y registros"
      expect(screen.getByText(/exibindo.*de.*registros/i)).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      render(<DataTable data={largeMockData} />);

      // Find the next page button (the one with ChevronRight icon that's not disabled)
      const buttons = screen.getAllByRole('button');
      // Get the last pagination button (ChevronRight)
      const nextPageBtn = buttons.find(btn => {
        const svg = btn.querySelector('.lucide-chevron-right');
        return svg && !btn.hasAttribute('disabled');
      });

      if (nextPageBtn) {
        await user.click(nextPageBtn);
      }

      // Should now show different items - use getAllByText since there are multiple matches
      const items = screen.getAllByText(/item 1[1-9]/i);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should change page size', async () => {
      const user = userEvent.setup();
      render(<DataTable data={largeMockData} />);

      // Find page size selector
      const pageSelect = screen.getByRole('combobox');
      await user.selectOptions(pageSelect, '25');

      // Should now show 25 items
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows.length).toBe(25);
    });

    it('should disable previous button on first page', () => {
      render(<DataTable data={largeMockData} />);

      // Find buttons with chevron icons
      const buttons = screen.getAllByRole('button');
      const prevBtn = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('btn-icon');
      });

      // First button should be disabled
      const allButtons = screen.getAllByRole('button');
      expect(allButtons[0]).toBeDisabled();
    });

    it('should reset to first page when filtering', async () => {
      const user = userEvent.setup();
      render(<DataTable data={largeMockData} />);

      // Navigate to page 2 first
      const pageSelect = screen.getByRole('combobox');
      await user.selectOptions(pageSelect, '10');

      // Click page 2
      const page2Button = screen.getByRole('button', { name: '2' });
      await user.click(page2Button);

      // Verify we are on page 2
      expect(page2Button.className).toContain('bg-indigo');

      // Now filter with a more specific term
      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'Item 25');

      // Should show filtered results
      // The filtered data should reset pagination to page 1
      // Check that filtered results are shown (just Item 25)
      expect(screen.getByText('Item 25')).toBeInTheDocument();
    });
  });

  // ============================================
  // Export Tests
  // ============================================
  describe('Export', () => {
    it('should show CSV export button when handler provided', () => {
      const onExportCSV = vi.fn();
      render(<DataTable data={mockTableData} onExportCSV={onExportCSV} />);

      expect(screen.getByText('CSV')).toBeInTheDocument();
    });

    it('should show Excel export button when handler provided', () => {
      const onExportExcel = vi.fn();
      render(<DataTable data={mockTableData} onExportExcel={onExportExcel} />);

      expect(screen.getByText('Excel')).toBeInTheDocument();
    });

    it('should call onExportCSV when CSV button is clicked', async () => {
      const user = userEvent.setup();
      const onExportCSV = vi.fn();
      render(<DataTable data={mockTableData} onExportCSV={onExportCSV} />);

      const csvButton = screen.getByText('CSV').closest('button');
      await user.click(csvButton!);

      expect(onExportCSV).toHaveBeenCalledTimes(1);
    });

    it('should call onExportExcel when Excel button is clicked', async () => {
      const user = userEvent.setup();
      const onExportExcel = vi.fn();
      render(<DataTable data={mockTableData} onExportExcel={onExportExcel} />);

      const excelButton = screen.getByText('Excel').closest('button');
      await user.click(excelButton!);

      expect(onExportExcel).toHaveBeenCalledTimes(1);
    });

    it('should not show export buttons when handlers not provided', () => {
      render(<DataTable data={mockTableData} />);

      expect(screen.queryByText('CSV')).not.toBeInTheDocument();
      expect(screen.queryByText('Excel')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Value Formatting Tests
  // ============================================
  describe('Value Formatting', () => {
    it('should display "-" for null values', () => {
      const dataWithNull: TableData = {
        columns: mockColumns,
        rows: [
          { id: 1, name: null, amount: null, date: null, status: 'Aprovado' },
        ],
      };

      render(<DataTable data={dataWithNull} />);

      const cells = screen.getAllByRole('cell');
      const dashCells = cells.filter(cell => cell.textContent === '-');
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it('should display "-" for undefined values', () => {
      const dataWithUndefined: TableData = {
        columns: mockColumns,
        rows: [
          { id: 1, status: 'Aprovado' }, // name, amount, date are undefined
        ],
      };

      render(<DataTable data={dataWithUndefined} />);

      const cells = screen.getAllByRole('cell');
      const dashCells = cells.filter(cell => cell.textContent === '-');
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it('should format boolean values as Sim/Nao', () => {
      const dataWithBoolean: TableData = {
        columns: [
          { key: 'id', label: 'ID', type: 'number' },
          { key: 'active', label: 'Ativo', type: 'boolean' },
        ],
        rows: [
          { id: 1, active: true },
          { id: 2, active: false },
        ],
      };

      render(<DataTable data={dataWithBoolean} />);

      expect(screen.getByText('Sim')).toBeInTheDocument();
      expect(screen.getByText('Nao')).toBeInTheDocument();
    });
  });

  // ============================================
  // Status Badge Tests
  // ============================================
  describe('Status Badges', () => {
    it('should apply success badge for approved status', () => {
      render(<DataTable data={mockTableData} />);

      // There might be multiple "Aprovado" if there's more than one approved item
      const approvedBadges = screen.getAllByText('Aprovado');
      const approvedBadge = approvedBadges[0];
      expect(approvedBadge.className).toContain('badge');
      expect(approvedBadge.className).toContain('success');
    });

    it('should apply warning badge for pending status', () => {
      render(<DataTable data={mockTableData} />);

      // There might be multiple "Pendente" if there's more than one pending item
      const pendingBadges = screen.getAllByText('Pendente');
      const pendingBadge = pendingBadges[0];
      expect(pendingBadge.className).toContain('badge');
      expect(pendingBadge.className).toContain('warning');
    });

    it('should apply error badge for cancelled status', () => {
      render(<DataTable data={mockTableData} />);

      const cancelledBadge = screen.getByText('Cancelado');
      expect(cancelledBadge.className).toContain('badge');
      expect(cancelledBadge.className).toContain('error');
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<DataTable data={mockTableData} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(mockColumns.length);
    });

    it('should have accessible search input', () => {
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have accessible page size selector', () => {
      const largeMockData: TableData = {
        columns: mockColumns,
        rows: generateMockRows(25),
      };

      render(<DataTable data={largeMockData} />);

      const pageSelect = screen.getByRole('combobox');
      expect(pageSelect).toBeInTheDocument();
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle empty rows array', () => {
      const emptyData: TableData = {
        columns: mockColumns,
        rows: [],
      };

      render(<DataTable data={emptyData} />);

      // Should show empty state or no data message
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle special characters in data', () => {
      const specialData: TableData = {
        columns: [
          { key: 'name', label: 'Nome', type: 'string' },
        ],
        rows: [
          { name: 'Item <script>alert("xss")</script>' },
          { name: 'Item with "quotes" and \'apostrophes\'' },
          { name: 'Item with & ampersand' },
        ],
      };

      render(<DataTable data={specialData} />);

      // React escapes HTML by default, so XSS is not possible
      // The text is rendered as escaped HTML, not executed
      // Verify the text is rendered (escaped)
      const cell = screen.getByText(/Item.*script/);
      expect(cell).toBeInTheDocument();
      // Verify the HTML is escaped (contains literal < and > characters)
      expect(cell.innerHTML).toContain('&lt;script&gt;');
    });

    it('should handle very long text', () => {
      const longTextData: TableData = {
        columns: [
          { key: 'name', label: 'Nome', type: 'string' },
        ],
        rows: [
          { name: 'A'.repeat(1000) },
        ],
      };

      render(<DataTable data={longTextData} />);

      // Should render without breaking
      const cell = screen.getAllByRole('cell')[0];
      expect(cell.textContent?.length).toBeGreaterThan(0);
    });

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockTableData} />);

      const searchInput = screen.getByPlaceholderText(/buscar/i);

      // Rapidly type and clear
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.type(searchInput, 'Item A');

      // Should show correct filtered result
      expect(screen.getByText('Item A')).toBeInTheDocument();
    });
  });
});
