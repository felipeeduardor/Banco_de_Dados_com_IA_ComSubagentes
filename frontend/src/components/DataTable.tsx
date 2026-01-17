import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import type { TableData, Column, TableSort, Pagination } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/queryParser';

interface DataTableProps {
  data: TableData | null;
  isLoading?: boolean;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function DataTable({
  data,
  isLoading = false,
  onExportCSV,
  onExportExcel,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<TableSort | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Filtra os dados baseado no termo de busca
  const filteredData = useMemo(() => {
    if (!data?.rows) return [];
    if (!searchTerm.trim()) return data.rows;

    const term = searchTerm.toLowerCase();
    return data.rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(term)
      )
    );
  }, [data?.rows, searchTerm]);

  // Ordena os dados
  const sortedData = useMemo(() => {
    if (!sort) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sort.column];
      const bValue = b[sort.column];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'pt-BR');
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sort]);

  // Pagina os dados
  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination.page, pagination.pageSize]);

  // Atualiza a paginacao quando os dados mudam
  useMemo(() => {
    const total = filteredData.length;
    const totalPages = Math.ceil(total / pagination.pageSize) || 1;
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
      page: prev.page > totalPages ? 1 : prev.page,
    }));
  }, [filteredData.length, pagination.pageSize]);

  // Handler para ordenacao
  const handleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev?.column === column) {
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' };
        }
        return null;
      }
      return { column, direction: 'asc' };
    });
  }, []);

  // Handler para mudar pagina
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Handler para mudar tamanho da pagina
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newSize,
      page: 1,
    }));
  }, []);

  // Formata o valor baseado no tipo da coluna
  const formatValue = useCallback((value: unknown, column: Column): string => {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        return formatCurrency(value as number);
      case 'date':
        return formatDate(value as string);
      case 'number':
        return formatNumber(value as number);
      case 'boolean':
        return value ? 'Sim' : 'Nao';
      case 'status':
        return String(value);
      default:
        return String(value);
    }
  }, []);

  // Retorna a classe CSS para o status
  const getStatusClass = useCallback((value: unknown): string => {
    const status = String(value).toLowerCase();
    switch (status) {
      case 'aprovado':
      case 'concluido':
      case 'ativo':
      case 'success':
        return 'badge-success';
      case 'pendente':
      case 'aguardando':
      case 'warning':
        return 'badge-warning';
      case 'cancelado':
      case 'negado':
      case 'inativo':
      case 'error':
        return 'badge-error';
      case 'processando':
      case 'em_analise':
      case 'info':
        return 'badge-info';
      default:
        return 'badge-gray';
    }
  }, []);

  // Icone de ordenacao
  const renderSortIcon = useCallback(
    (column: string) => {
      if (sort?.column !== column) {
        return <ChevronUp className="w-4 h-4 opacity-30" />;
      }
      return sort.direction === 'asc' ? (
        <ChevronUp className="w-4 h-4 text-indigo-600" />
      ) : (
        <ChevronDown className="w-4 h-4 text-indigo-600" />
      );
    },
    [sort]
  );

  // Estado de loading
  if (isLoading) {
    return (
      <div className="card-static">
        <div className="card-body">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado vazio
  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <div className="card-static">
        <div className="empty-state py-16">
          <Database className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum dado para exibir
          </h3>
          <p className="text-gray-500 max-w-sm">
            Faca uma pergunta no chat para consultar os dados ou selecione uma
            tabela para visualizar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-static">
      {/* Header com busca e exportacao */}
      <div className="card-header flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar nos resultados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2">
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="btn-secondary flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="table-container border-0 rounded-none">
        <table className="data-table">
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={sort?.column === column.key ? 'sorted' : ''}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={data.columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  Nenhum resultado encontrado para "{searchTerm}"
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {data.columns.map((column) => (
                    <td key={column.key}>
                      {column.type === 'status' ? (
                        <span
                          className={`badge ${getStatusClass(row[column.key])}`}
                        >
                          {formatValue(row[column.key], column)}
                        </span>
                      ) : (
                        formatValue(row[column.key], column)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer com paginacao */}
      <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Exibindo {paginatedData.length} de {pagination.total} registros
          </span>

          <select
            value={pagination.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="select-field w-auto py-1.5 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} por pagina
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-icon"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-icon"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
