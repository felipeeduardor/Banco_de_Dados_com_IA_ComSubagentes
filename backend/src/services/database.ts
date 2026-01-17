/**
 * Database Service
 * Handles database operations with Supabase or mock data fallback
 *
 * Operation Modes:
 * - PRODUCTION: Uses Supabase for all database operations
 * - DEMO: Uses in-memory mock data for demonstration purposes
 *
 * The service automatically detects the mode based on Supabase configuration
 * and seamlessly switches between real and mock data sources.
 */

import { getClient, isConfigured, isDemoMode } from '../config/supabase.js';
import type {
  TableSchema,
  Transaction,
  Product,
  Customer,
  Order,
  QueryExecutionResult,
} from '../types/index.js';

// Track query statistics for monitoring
interface QueryStats {
  totalQueries: number;
  mockQueries: number;
  supabaseQueries: number;
  failedQueries: number;
  lastQueryTime: number;
}

const queryStats: QueryStats = {
  totalQueries: 0,
  mockQueries: 0,
  supabaseQueries: 0,
  failedQueries: 0,
  lastQueryTime: 0,
};

// ============================================
// Mock Data - Transactions (120 records)
// ============================================
const MOCK_TRANSACTIONS: Transaction[] = [
  // Janeiro 2024
  { id: 1, date: '2024-01-15', amount: 1500.00, status: 'Aprovado', customer: 'Joao Silva', product: 'Curso Python' },
  { id: 2, date: '2024-01-15', amount: 2300.00, status: 'Aprovado', customer: 'Maria Santos', product: 'Curso JavaScript' },
  { id: 3, date: '2024-01-14', amount: 890.00, status: 'Pendente', customer: 'Carlos Oliveira', product: 'Curso React' },
  { id: 4, date: '2024-01-14', amount: 3200.00, status: 'Aprovado', customer: 'Ana Pereira', product: 'Curso Full Stack' },
  { id: 5, date: '2024-01-13', amount: 1500.00, status: 'Aprovado', customer: 'Pedro Costa', product: 'Curso Python' },
  { id: 6, date: '2024-01-13', amount: 1800.00, status: 'Aprovado', customer: 'Lucia Ferreira', product: 'Curso Node.js' },
  { id: 7, date: '2024-01-12', amount: 2100.00, status: 'Aprovado', customer: 'Roberto Almeida', product: 'Curso TypeScript' },
  { id: 8, date: '2024-01-12', amount: 950.00, status: 'Reembolsado', customer: 'Fernanda Lima', product: 'Curso Vue.js' },
  { id: 9, date: '2024-01-11', amount: 2300.00, status: 'Aprovado', customer: 'Marcos Souza', product: 'Curso JavaScript' },
  { id: 10, date: '2024-01-11', amount: 2800.00, status: 'Aprovado', customer: 'Juliana Martins', product: 'Curso DevOps' },
  { id: 11, date: '2024-01-10', amount: 1200.00, status: 'Pendente', customer: 'Ricardo Gomes', product: 'Curso Docker' },
  { id: 12, date: '2024-01-10', amount: 3500.00, status: 'Aprovado', customer: 'Patricia Ribeiro', product: 'Curso AWS' },
  { id: 13, date: '2024-01-09', amount: 890.00, status: 'Aprovado', customer: 'Bruno Carvalho', product: 'Curso React' },
  { id: 14, date: '2024-01-09', amount: 2200.00, status: 'Cancelado', customer: 'Camila Rocha', product: 'Curso Machine Learning' },
  { id: 15, date: '2024-01-08', amount: 1900.00, status: 'Aprovado', customer: 'Diego Mendes', product: 'Curso Data Science' },
  { id: 16, date: '2024-01-08', amount: 1350.00, status: 'Aprovado', customer: 'Amanda Dias', product: 'Curso SQL' },
  { id: 17, date: '2024-01-07', amount: 1500.00, status: 'Aprovado', customer: 'Felipe Araujo', product: 'Curso Python' },
  { id: 18, date: '2024-01-07', amount: 890.00, status: 'Pendente', customer: 'Renata Barros', product: 'Curso React' },
  { id: 19, date: '2024-01-06', amount: 3200.00, status: 'Aprovado', customer: 'Gustavo Nunes', product: 'Curso Full Stack' },
  { id: 20, date: '2024-01-06', amount: 2300.00, status: 'Aprovado', customer: 'Isabela Castro', product: 'Curso JavaScript' },
  // Dezembro 2023
  { id: 21, date: '2023-12-28', amount: 1800.00, status: 'Aprovado', customer: 'Joao Silva', product: 'Curso Node.js' },
  { id: 22, date: '2023-12-28', amount: 2100.00, status: 'Aprovado', customer: 'Maria Santos', product: 'Curso TypeScript' },
  { id: 23, date: '2023-12-27', amount: 3500.00, status: 'Aprovado', customer: 'Carlos Oliveira', product: 'Curso AWS' },
  { id: 24, date: '2023-12-27', amount: 1500.00, status: 'Cancelado', customer: 'Ana Pereira', product: 'Curso Python' },
  { id: 25, date: '2023-12-26', amount: 2800.00, status: 'Aprovado', customer: 'Pedro Costa', product: 'Curso DevOps' },
  { id: 26, date: '2023-12-26', amount: 890.00, status: 'Aprovado', customer: 'Lucia Ferreira', product: 'Curso React' },
  { id: 27, date: '2023-12-25', amount: 2300.00, status: 'Aprovado', customer: 'Roberto Almeida', product: 'Curso JavaScript' },
  { id: 28, date: '2023-12-25', amount: 1200.00, status: 'Pendente', customer: 'Fernanda Lima', product: 'Curso Docker' },
  { id: 29, date: '2023-12-24', amount: 1900.00, status: 'Aprovado', customer: 'Marcos Souza', product: 'Curso Data Science' },
  { id: 30, date: '2023-12-24', amount: 3200.00, status: 'Aprovado', customer: 'Juliana Martins', product: 'Curso Full Stack' },
  { id: 31, date: '2023-12-23', amount: 1500.00, status: 'Aprovado', customer: 'Ricardo Gomes', product: 'Curso Python' },
  { id: 32, date: '2023-12-23', amount: 2200.00, status: 'Aprovado', customer: 'Patricia Ribeiro', product: 'Curso Machine Learning' },
  { id: 33, date: '2023-12-22', amount: 1350.00, status: 'Reembolsado', customer: 'Bruno Carvalho', product: 'Curso SQL' },
  { id: 34, date: '2023-12-22', amount: 950.00, status: 'Aprovado', customer: 'Camila Rocha', product: 'Curso Vue.js' },
  { id: 35, date: '2023-12-21', amount: 2300.00, status: 'Aprovado', customer: 'Diego Mendes', product: 'Curso JavaScript' },
  { id: 36, date: '2023-12-21', amount: 1800.00, status: 'Aprovado', customer: 'Amanda Dias', product: 'Curso Node.js' },
  { id: 37, date: '2023-12-20', amount: 890.00, status: 'Pendente', customer: 'Felipe Araujo', product: 'Curso React' },
  { id: 38, date: '2023-12-20', amount: 3500.00, status: 'Aprovado', customer: 'Renata Barros', product: 'Curso AWS' },
  { id: 39, date: '2023-12-19', amount: 2100.00, status: 'Aprovado', customer: 'Gustavo Nunes', product: 'Curso TypeScript' },
  { id: 40, date: '2023-12-19', amount: 1500.00, status: 'Aprovado', customer: 'Isabela Castro', product: 'Curso Python' },
  // Novembro 2023
  { id: 41, date: '2023-11-30', amount: 2800.00, status: 'Aprovado', customer: 'Joao Silva', product: 'Curso DevOps' },
  { id: 42, date: '2023-11-29', amount: 3200.00, status: 'Aprovado', customer: 'Maria Santos', product: 'Curso Full Stack' },
  { id: 43, date: '2023-11-28', amount: 1200.00, status: 'Cancelado', customer: 'Carlos Oliveira', product: 'Curso Docker' },
  { id: 44, date: '2023-11-27', amount: 2300.00, status: 'Aprovado', customer: 'Ana Pereira', product: 'Curso JavaScript' },
  { id: 45, date: '2023-11-26', amount: 1900.00, status: 'Aprovado', customer: 'Pedro Costa', product: 'Curso Data Science' },
  { id: 46, date: '2023-11-25', amount: 1500.00, status: 'Aprovado', customer: 'Lucia Ferreira', product: 'Curso Python' },
  { id: 47, date: '2023-11-24', amount: 890.00, status: 'Pendente', customer: 'Roberto Almeida', product: 'Curso React' },
  { id: 48, date: '2023-11-23', amount: 2200.00, status: 'Aprovado', customer: 'Fernanda Lima', product: 'Curso Machine Learning' },
  { id: 49, date: '2023-11-22', amount: 3500.00, status: 'Aprovado', customer: 'Marcos Souza', product: 'Curso AWS' },
  { id: 50, date: '2023-11-21', amount: 1800.00, status: 'Aprovado', customer: 'Juliana Martins', product: 'Curso Node.js' },
  { id: 51, date: '2023-11-20', amount: 2100.00, status: 'Reembolsado', customer: 'Ricardo Gomes', product: 'Curso TypeScript' },
  { id: 52, date: '2023-11-19', amount: 1350.00, status: 'Aprovado', customer: 'Patricia Ribeiro', product: 'Curso SQL' },
  { id: 53, date: '2023-11-18', amount: 950.00, status: 'Aprovado', customer: 'Bruno Carvalho', product: 'Curso Vue.js' },
  { id: 54, date: '2023-11-17', amount: 2300.00, status: 'Aprovado', customer: 'Camila Rocha', product: 'Curso JavaScript' },
  { id: 55, date: '2023-11-16', amount: 1500.00, status: 'Pendente', customer: 'Diego Mendes', product: 'Curso Python' },
  { id: 56, date: '2023-11-15', amount: 2800.00, status: 'Aprovado', customer: 'Amanda Dias', product: 'Curso DevOps' },
  { id: 57, date: '2023-11-14', amount: 890.00, status: 'Aprovado', customer: 'Felipe Araujo', product: 'Curso React' },
  { id: 58, date: '2023-11-13', amount: 3200.00, status: 'Aprovado', customer: 'Renata Barros', product: 'Curso Full Stack' },
  { id: 59, date: '2023-11-12', amount: 1200.00, status: 'Cancelado', customer: 'Gustavo Nunes', product: 'Curso Docker' },
  { id: 60, date: '2023-11-11', amount: 1900.00, status: 'Aprovado', customer: 'Isabela Castro', product: 'Curso Data Science' },
  // Outubro 2023
  { id: 61, date: '2023-10-31', amount: 2300.00, status: 'Aprovado', customer: 'Joao Silva', product: 'Curso JavaScript' },
  { id: 62, date: '2023-10-30', amount: 1500.00, status: 'Aprovado', customer: 'Maria Santos', product: 'Curso Python' },
  { id: 63, date: '2023-10-29', amount: 3500.00, status: 'Aprovado', customer: 'Carlos Oliveira', product: 'Curso AWS' },
  { id: 64, date: '2023-10-28', amount: 890.00, status: 'Pendente', customer: 'Ana Pereira', product: 'Curso React' },
  { id: 65, date: '2023-10-27', amount: 2100.00, status: 'Aprovado', customer: 'Pedro Costa', product: 'Curso TypeScript' },
  { id: 66, date: '2023-10-26', amount: 1800.00, status: 'Aprovado', customer: 'Lucia Ferreira', product: 'Curso Node.js' },
  { id: 67, date: '2023-10-25', amount: 2200.00, status: 'Reembolsado', customer: 'Roberto Almeida', product: 'Curso Machine Learning' },
  { id: 68, date: '2023-10-24', amount: 3200.00, status: 'Aprovado', customer: 'Fernanda Lima', product: 'Curso Full Stack' },
  { id: 69, date: '2023-10-23', amount: 1350.00, status: 'Aprovado', customer: 'Marcos Souza', product: 'Curso SQL' },
  { id: 70, date: '2023-10-22', amount: 2800.00, status: 'Aprovado', customer: 'Juliana Martins', product: 'Curso DevOps' },
  { id: 71, date: '2023-10-21', amount: 950.00, status: 'Cancelado', customer: 'Ricardo Gomes', product: 'Curso Vue.js' },
  { id: 72, date: '2023-10-20', amount: 1500.00, status: 'Aprovado', customer: 'Patricia Ribeiro', product: 'Curso Python' },
  { id: 73, date: '2023-10-19', amount: 1200.00, status: 'Aprovado', customer: 'Bruno Carvalho', product: 'Curso Docker' },
  { id: 74, date: '2023-10-18', amount: 2300.00, status: 'Aprovado', customer: 'Camila Rocha', product: 'Curso JavaScript' },
  { id: 75, date: '2023-10-17', amount: 890.00, status: 'Pendente', customer: 'Diego Mendes', product: 'Curso React' },
  { id: 76, date: '2023-10-16', amount: 1900.00, status: 'Aprovado', customer: 'Amanda Dias', product: 'Curso Data Science' },
  { id: 77, date: '2023-10-15', amount: 3500.00, status: 'Aprovado', customer: 'Felipe Araujo', product: 'Curso AWS' },
  { id: 78, date: '2023-10-14', amount: 1800.00, status: 'Aprovado', customer: 'Renata Barros', product: 'Curso Node.js' },
  { id: 79, date: '2023-10-13', amount: 2100.00, status: 'Aprovado', customer: 'Gustavo Nunes', product: 'Curso TypeScript' },
  { id: 80, date: '2023-10-12', amount: 1500.00, status: 'Aprovado', customer: 'Isabela Castro', product: 'Curso Python' },
  // Setembro 2023
  { id: 81, date: '2023-09-30', amount: 2800.00, status: 'Aprovado', customer: 'Joao Silva', product: 'Curso DevOps' },
  { id: 82, date: '2023-09-29', amount: 890.00, status: 'Cancelado', customer: 'Maria Santos', product: 'Curso React' },
  { id: 83, date: '2023-09-28', amount: 3200.00, status: 'Aprovado', customer: 'Carlos Oliveira', product: 'Curso Full Stack' },
  { id: 84, date: '2023-09-27', amount: 2300.00, status: 'Aprovado', customer: 'Ana Pereira', product: 'Curso JavaScript' },
  { id: 85, date: '2023-09-26', amount: 1200.00, status: 'Pendente', customer: 'Pedro Costa', product: 'Curso Docker' },
  { id: 86, date: '2023-09-25', amount: 1500.00, status: 'Aprovado', customer: 'Lucia Ferreira', product: 'Curso Python' },
  { id: 87, date: '2023-09-24', amount: 2200.00, status: 'Aprovado', customer: 'Roberto Almeida', product: 'Curso Machine Learning' },
  { id: 88, date: '2023-09-23', amount: 1350.00, status: 'Aprovado', customer: 'Fernanda Lima', product: 'Curso SQL' },
  { id: 89, date: '2023-09-22', amount: 3500.00, status: 'Reembolsado', customer: 'Marcos Souza', product: 'Curso AWS' },
  { id: 90, date: '2023-09-21', amount: 950.00, status: 'Aprovado', customer: 'Juliana Martins', product: 'Curso Vue.js' },
  { id: 91, date: '2023-09-20', amount: 1800.00, status: 'Aprovado', customer: 'Ricardo Gomes', product: 'Curso Node.js' },
  { id: 92, date: '2023-09-19', amount: 2100.00, status: 'Aprovado', customer: 'Patricia Ribeiro', product: 'Curso TypeScript' },
  { id: 93, date: '2023-09-18', amount: 1500.00, status: 'Pendente', customer: 'Bruno Carvalho', product: 'Curso Python' },
  { id: 94, date: '2023-09-17', amount: 2300.00, status: 'Aprovado', customer: 'Camila Rocha', product: 'Curso JavaScript' },
  { id: 95, date: '2023-09-16', amount: 890.00, status: 'Aprovado', customer: 'Diego Mendes', product: 'Curso React' },
  { id: 96, date: '2023-09-15', amount: 3200.00, status: 'Aprovado', customer: 'Amanda Dias', product: 'Curso Full Stack' },
  { id: 97, date: '2023-09-14', amount: 2800.00, status: 'Cancelado', customer: 'Felipe Araujo', product: 'Curso DevOps' },
  { id: 98, date: '2023-09-13', amount: 1900.00, status: 'Aprovado', customer: 'Renata Barros', product: 'Curso Data Science' },
  { id: 99, date: '2023-09-12', amount: 1200.00, status: 'Aprovado', customer: 'Gustavo Nunes', product: 'Curso Docker' },
  { id: 100, date: '2023-09-11', amount: 1500.00, status: 'Aprovado', customer: 'Isabela Castro', product: 'Curso Python' },
  // Agosto 2023
  { id: 101, date: '2023-08-31', amount: 3500.00, status: 'Aprovado', customer: 'Joao Silva', product: 'Curso AWS' },
  { id: 102, date: '2023-08-30', amount: 2300.00, status: 'Aprovado', customer: 'Maria Santos', product: 'Curso JavaScript' },
  { id: 103, date: '2023-08-29', amount: 1350.00, status: 'Pendente', customer: 'Carlos Oliveira', product: 'Curso SQL' },
  { id: 104, date: '2023-08-28', amount: 890.00, status: 'Aprovado', customer: 'Ana Pereira', product: 'Curso React' },
  { id: 105, date: '2023-08-27', amount: 2100.00, status: 'Aprovado', customer: 'Pedro Costa', product: 'Curso TypeScript' },
  { id: 106, date: '2023-08-26', amount: 1800.00, status: 'Reembolsado', customer: 'Lucia Ferreira', product: 'Curso Node.js' },
  { id: 107, date: '2023-08-25', amount: 3200.00, status: 'Aprovado', customer: 'Roberto Almeida', product: 'Curso Full Stack' },
  { id: 108, date: '2023-08-24', amount: 1500.00, status: 'Aprovado', customer: 'Fernanda Lima', product: 'Curso Python' },
  { id: 109, date: '2023-08-23', amount: 2800.00, status: 'Aprovado', customer: 'Marcos Souza', product: 'Curso DevOps' },
  { id: 110, date: '2023-08-22', amount: 950.00, status: 'Cancelado', customer: 'Juliana Martins', product: 'Curso Vue.js' },
  { id: 111, date: '2023-08-21', amount: 2200.00, status: 'Aprovado', customer: 'Ricardo Gomes', product: 'Curso Machine Learning' },
  { id: 112, date: '2023-08-20', amount: 1200.00, status: 'Aprovado', customer: 'Patricia Ribeiro', product: 'Curso Docker' },
  { id: 113, date: '2023-08-19', amount: 1900.00, status: 'Pendente', customer: 'Bruno Carvalho', product: 'Curso Data Science' },
  { id: 114, date: '2023-08-18', amount: 2300.00, status: 'Aprovado', customer: 'Camila Rocha', product: 'Curso JavaScript' },
  { id: 115, date: '2023-08-17', amount: 1500.00, status: 'Aprovado', customer: 'Diego Mendes', product: 'Curso Python' },
  { id: 116, date: '2023-08-16', amount: 3500.00, status: 'Aprovado', customer: 'Amanda Dias', product: 'Curso AWS' },
  { id: 117, date: '2023-08-15', amount: 890.00, status: 'Aprovado', customer: 'Felipe Araujo', product: 'Curso React' },
  { id: 118, date: '2023-08-14', amount: 1800.00, status: 'Aprovado', customer: 'Renata Barros', product: 'Curso Node.js' },
  { id: 119, date: '2023-08-13', amount: 2100.00, status: 'Reembolsado', customer: 'Gustavo Nunes', product: 'Curso TypeScript' },
  { id: 120, date: '2023-08-12', amount: 3200.00, status: 'Aprovado', customer: 'Isabela Castro', product: 'Curso Full Stack' },
];

// ============================================
// Mock Data - Products (10 records)
// ============================================
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Curso Python', price: 1500.00, category: 'Programacao', stock: 999 },
  { id: 2, name: 'Curso JavaScript', price: 2300.00, category: 'Programacao', stock: 999 },
  { id: 3, name: 'Curso React', price: 890.00, category: 'Frontend', stock: 999 },
  { id: 4, name: 'Curso Full Stack', price: 3200.00, category: 'Desenvolvimento', stock: 999 },
  { id: 5, name: 'Curso HTML/CSS', price: 450.00, category: 'Frontend', stock: 999 },
  { id: 6, name: 'Curso Node.js', price: 1800.00, category: 'Backend', stock: 999 },
  { id: 7, name: 'Curso TypeScript', price: 2100.00, category: 'Programacao', stock: 999 },
  { id: 8, name: 'Curso Vue.js', price: 950.00, category: 'Frontend', stock: 999 },
  { id: 9, name: 'Curso AWS', price: 3500.00, category: 'Cloud', stock: 999 },
  { id: 10, name: 'Curso Docker', price: 1200.00, category: 'DevOps', stock: 999 },
];

// ============================================
// Mock Data - Customers (15 records)
// ============================================
const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Joao Silva', email: 'joao.silva@email.com', city: 'Sao Paulo', total_purchases: 5200.00, created_at: '2023-06-15' },
  { id: 2, name: 'Maria Santos', email: 'maria.santos@email.com', city: 'Rio de Janeiro', total_purchases: 8900.00, created_at: '2023-07-20' },
  { id: 3, name: 'Carlos Oliveira', email: 'carlos.oliveira@email.com', city: 'Belo Horizonte', total_purchases: 3400.00, created_at: '2023-08-10' },
  { id: 4, name: 'Ana Pereira', email: 'ana.pereira@email.com', city: 'Salvador', total_purchases: 12500.00, created_at: '2023-05-05' },
  { id: 5, name: 'Pedro Costa', email: 'pedro.costa@email.com', city: 'Brasilia', total_purchases: 1800.00, created_at: '2023-09-25' },
  { id: 6, name: 'Lucia Ferreira', email: 'lucia.ferreira@email.com', city: 'Curitiba', total_purchases: 6700.00, created_at: '2023-04-12' },
  { id: 7, name: 'Roberto Almeida', email: 'roberto.almeida@email.com', city: 'Porto Alegre', total_purchases: 9200.00, created_at: '2023-03-18' },
  { id: 8, name: 'Fernanda Lima', email: 'fernanda.lima@email.com', city: 'Recife', total_purchases: 4100.00, created_at: '2023-10-01' },
  { id: 9, name: 'Marcos Souza', email: 'marcos.souza@email.com', city: 'Fortaleza', total_purchases: 7800.00, created_at: '2023-02-28' },
  { id: 10, name: 'Juliana Martins', email: 'juliana.martins@email.com', city: 'Manaus', total_purchases: 15600.00, created_at: '2023-01-14' },
  { id: 11, name: 'Ricardo Gomes', email: 'ricardo.gomes@email.com', city: 'Goiania', total_purchases: 2900.00, created_at: '2023-11-05' },
  { id: 12, name: 'Patricia Ribeiro', email: 'patricia.ribeiro@email.com', city: 'Campinas', total_purchases: 11200.00, created_at: '2023-06-30' },
  { id: 13, name: 'Bruno Carvalho', email: 'bruno.carvalho@email.com', city: 'Natal', total_purchases: 3800.00, created_at: '2023-08-22' },
  { id: 14, name: 'Camila Rocha', email: 'camila.rocha@email.com', city: 'Florianopolis', total_purchases: 6400.00, created_at: '2023-07-08' },
  { id: 15, name: 'Diego Mendes', email: 'diego.mendes@email.com', city: 'Vitoria', total_purchases: 8100.00, created_at: '2023-04-25' },
];

// ============================================
// Mock Data - Orders (25 records)
// ============================================
const MOCK_ORDERS: Order[] = [
  { id: 1, customer_id: 1, product_id: 1, quantity: 1, total: 1500.00, status: 'Concluido', created_at: '2024-01-15' },
  { id: 2, customer_id: 2, product_id: 2, quantity: 1, total: 2300.00, status: 'Concluido', created_at: '2024-01-14' },
  { id: 3, customer_id: 3, product_id: 3, quantity: 1, total: 890.00, status: 'Pendente', created_at: '2024-01-13' },
  { id: 4, customer_id: 4, product_id: 4, quantity: 1, total: 3200.00, status: 'Concluido', created_at: '2024-01-12' },
  { id: 5, customer_id: 5, product_id: 5, quantity: 1, total: 450.00, status: 'Cancelado', created_at: '2024-01-11' },
  { id: 6, customer_id: 6, product_id: 6, quantity: 1, total: 1800.00, status: 'Concluido', created_at: '2024-01-10' },
  { id: 7, customer_id: 7, product_id: 7, quantity: 1, total: 2100.00, status: 'Enviado', created_at: '2024-01-09' },
  { id: 8, customer_id: 8, product_id: 8, quantity: 1, total: 950.00, status: 'Cancelado', created_at: '2024-01-08' },
  { id: 9, customer_id: 9, product_id: 3, quantity: 2, total: 1780.00, status: 'Concluido', created_at: '2024-01-07' },
  { id: 10, customer_id: 10, product_id: 9, quantity: 1, total: 3500.00, status: 'Concluido', created_at: '2024-01-06' },
  { id: 11, customer_id: 11, product_id: 10, quantity: 1, total: 1200.00, status: 'Pendente', created_at: '2024-01-05' },
  { id: 12, customer_id: 12, product_id: 4, quantity: 1, total: 3200.00, status: 'Concluido', created_at: '2024-01-04' },
  { id: 13, customer_id: 13, product_id: 1, quantity: 1, total: 1500.00, status: 'Enviado', created_at: '2024-01-03' },
  { id: 14, customer_id: 14, product_id: 2, quantity: 1, total: 2300.00, status: 'Pendente', created_at: '2024-01-02' },
  { id: 15, customer_id: 15, product_id: 6, quantity: 1, total: 1800.00, status: 'Concluido', created_at: '2024-01-01' },
  { id: 16, customer_id: 1, product_id: 7, quantity: 1, total: 2100.00, status: 'Concluido', created_at: '2023-12-31' },
  { id: 17, customer_id: 2, product_id: 9, quantity: 1, total: 3500.00, status: 'Concluido', created_at: '2023-12-30' },
  { id: 18, customer_id: 3, product_id: 10, quantity: 2, total: 2400.00, status: 'Enviado', created_at: '2023-12-29' },
  { id: 19, customer_id: 4, product_id: 1, quantity: 1, total: 1500.00, status: 'Concluido', created_at: '2023-12-28' },
  { id: 20, customer_id: 5, product_id: 3, quantity: 1, total: 890.00, status: 'Pendente', created_at: '2023-12-27' },
  { id: 21, customer_id: 6, product_id: 4, quantity: 1, total: 3200.00, status: 'Concluido', created_at: '2023-12-26' },
  { id: 22, customer_id: 7, product_id: 5, quantity: 2, total: 900.00, status: 'Concluido', created_at: '2023-12-25' },
  { id: 23, customer_id: 8, product_id: 6, quantity: 1, total: 1800.00, status: 'Enviado', created_at: '2023-12-24' },
  { id: 24, customer_id: 9, product_id: 7, quantity: 1, total: 2100.00, status: 'Concluido', created_at: '2023-12-23' },
  { id: 25, customer_id: 10, product_id: 2, quantity: 2, total: 4600.00, status: 'Concluido', created_at: '2023-12-22' },
];

// ============================================
// Mock Data Map
// ============================================
type MockDataRecord = Record<string, unknown>;

const MOCK_DATA: Record<string, MockDataRecord[]> = {
  transactions: MOCK_TRANSACTIONS as unknown as MockDataRecord[],
  products: MOCK_PRODUCTS as unknown as MockDataRecord[],
  customers: MOCK_CUSTOMERS as unknown as MockDataRecord[],
  orders: MOCK_ORDERS as unknown as MockDataRecord[],
};

// ============================================
// Table Schemas
// ============================================
const TABLE_SCHEMAS: Record<string, TableSchema> = {
  transactions: {
    name: 'transactions',
    columns: [
      { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
      { name: 'date', type: 'date', nullable: false },
      { name: 'amount', type: 'decimal', nullable: false },
      { name: 'status', type: 'varchar', nullable: false },
      { name: 'customer', type: 'varchar', nullable: false },
      { name: 'product', type: 'varchar', nullable: false },
    ],
    rowCount: 120, // MOCK_TRANSACTIONS.length
  },
  products: {
    name: 'products',
    columns: [
      { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
      { name: 'name', type: 'varchar', nullable: false },
      { name: 'price', type: 'decimal', nullable: false },
      { name: 'category', type: 'varchar', nullable: false },
      { name: 'stock', type: 'integer', nullable: false },
    ],
    rowCount: MOCK_PRODUCTS.length,
  },
  customers: {
    name: 'customers',
    columns: [
      { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
      { name: 'name', type: 'varchar', nullable: false },
      { name: 'email', type: 'varchar', nullable: false },
      { name: 'city', type: 'varchar', nullable: false },
      { name: 'total_purchases', type: 'decimal', nullable: false },
      { name: 'created_at', type: 'date', nullable: false },
    ],
    rowCount: MOCK_CUSTOMERS.length,
  },
  orders: {
    name: 'orders',
    columns: [
      { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
      { name: 'customer_id', type: 'integer', nullable: false, isForeignKey: true, references: { table: 'customers', column: 'id' } },
      { name: 'product_id', type: 'integer', nullable: false, isForeignKey: true, references: { table: 'products', column: 'id' } },
      { name: 'quantity', type: 'integer', nullable: false },
      { name: 'total', type: 'decimal', nullable: false },
      { name: 'status', type: 'varchar', nullable: false },
      { name: 'created_at', type: 'date', nullable: false },
    ],
    rowCount: MOCK_ORDERS.length,
  },
};

// ============================================
// Database Service Functions
// ============================================

/**
 * Get all available tables
 */
export function getAllTables(): string[] {
  return Object.keys(MOCK_DATA);
}

/**
 * Get schema for a specific table
 */
export function getTableSchema(tableName: string): TableSchema | null {
  const normalizedName = tableName.toLowerCase();
  return TABLE_SCHEMAS[normalizedName] || null;
}

/**
 * Get all table schemas
 */
export function getAllTableSchemas(): TableSchema[] {
  return Object.values(TABLE_SCHEMAS);
}

/**
 * Execute a query against the database or mock data
 * Automatically handles fallback from Supabase to mock data
 */
export async function executeQuery(
  tableName: string,
  options?: {
    filters?: Record<string, unknown>;
    orderBy?: { column: string; direction: 'ASC' | 'DESC' };
    limit?: number;
    offset?: number;
  }
): Promise<QueryExecutionResult> {
  const startTime = Date.now();
  const normalizedTable = tableName.toLowerCase();

  queryStats.totalQueries++;

  // Try Supabase first if configured
  if (isConfigured()) {
    try {
      const client = getClient();
      if (client) {
        let query = client.from(normalizedTable).select('*');

        if (options?.filters) {
          for (const [key, value] of Object.entries(options.filters)) {
            query = query.eq(key, value);
          }
        }

        if (options?.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.direction === 'ASC',
          });
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        if (options?.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        queryStats.supabaseQueries++;
        queryStats.lastQueryTime = Date.now() - startTime;

        return {
          data: data as Record<string, unknown>[],
          rowCount: data?.length || 0,
          executionTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      queryStats.failedQueries++;
      console.warn('[Database] Falha ao consultar Supabase, usando mock:', error);
      // Fall through to mock data
    }
  }

  // Fallback to mock data
  queryStats.mockQueries++;
  let data = MOCK_DATA[normalizedTable];

  if (!data) {
    return {
      data: [],
      rowCount: 0,
      executionTime: Date.now() - startTime,
    };
  }

  // Apply filters
  if (options?.filters) {
    data = data.filter((row) => {
      return Object.entries(options.filters!).every(([key, value]) => {
        const rowValue = row[key];
        if (typeof value === 'string' && typeof rowValue === 'string') {
          return rowValue.toLowerCase().includes(value.toLowerCase());
        }
        return rowValue === value;
      });
    });
  }

  // Apply ordering
  if (options?.orderBy) {
    const { column, direction } = options.orderBy;
    data = [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'ASC' ? comparison : -comparison;
    });
  }

  // Apply offset and limit
  if (options?.offset) {
    data = data.slice(options.offset);
  }
  if (options?.limit) {
    data = data.slice(0, options.limit);
  }

  queryStats.lastQueryTime = Date.now() - startTime;

  return {
    data,
    rowCount: data.length,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Execute a raw SQL-like query on mock data
 * This is a simplified SQL parser for demonstration purposes
 */
export async function executeRawQuery(sql: string): Promise<QueryExecutionResult> {
  const startTime = Date.now();
  const normalizedSQL = sql.trim().toLowerCase();

  // Try Supabase RPC if configured
  if (isConfigured()) {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('execute_sql', { query: sql });
        if (!error && data) {
          return {
            data: data as Record<string, unknown>[],
            rowCount: (data as unknown[]).length,
            executionTime: Date.now() - startTime,
          };
        }
      } catch {
        console.warn('[Database] RPC nao disponivel, usando parser mock');
      }
    }
  }

  // Parse and execute on mock data
  const result = parseMockSQL(normalizedSQL);

  return {
    data: result,
    rowCount: result.length,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Simple SQL parser for mock data
 */
function parseMockSQL(sql: string): MockDataRecord[] {
  // Extract table name from query
  const fromMatch = sql.match(/from\s+(\w+)/i);
  if (!fromMatch) {
    console.warn('[Database] Tabela nao encontrada na query:', sql);
    return [];
  }

  const tableName = fromMatch[1].toLowerCase();
  let data = MOCK_DATA[tableName];

  if (!data) {
    console.warn('[Database] Tabela nao existe:', tableName);
    return [];
  }

  // Handle COUNT queries
  if (sql.includes('count(')) {
    const countMatch = sql.match(/count\(\s*\*?\s*\)/i);
    if (countMatch) {
      // Check for GROUP BY
      const groupByMatch = sql.match(/group\s+by\s+(\w+)/i);
      if (groupByMatch) {
        const groupColumn = groupByMatch[1];
        const grouped = new Map<string, number>();

        data.forEach((row) => {
          const key = String(row[groupColumn] ?? 'null');
          grouped.set(key, (grouped.get(key) || 0) + 1);
        });

        return Array.from(grouped.entries()).map(([key, count]) => ({
          [groupColumn]: key,
          count,
        }));
      }

      // Apply WHERE filter before counting
      data = applyWhereClause(data, sql);
      return [{ count: data.length }];
    }
  }

  // Handle SUM queries
  if (sql.includes('sum(')) {
    const sumMatch = sql.match(/sum\(\s*(\w+)\s*\)/i);
    if (sumMatch) {
      const column = sumMatch[1];

      // Check for GROUP BY
      const groupByMatch = sql.match(/group\s+by\s+(\w+)/i);
      if (groupByMatch) {
        const groupColumn = groupByMatch[1];
        const grouped = new Map<string, number>();

        data.forEach((row) => {
          const key = String(row[groupColumn] ?? 'null');
          const value = Number(row[column]) || 0;
          grouped.set(key, (grouped.get(key) || 0) + value);
        });

        return Array.from(grouped.entries()).map(([key, sum]) => ({
          [groupColumn]: key,
          sum,
        }));
      }

      // Apply WHERE filter before summing
      data = applyWhereClause(data, sql);
      const sum = data.reduce((acc, row) => acc + (Number(row[column]) || 0), 0);
      return [{ sum }];
    }
  }

  // Handle AVG queries
  if (sql.includes('avg(')) {
    const avgMatch = sql.match(/avg\(\s*(\w+)\s*\)/i);
    if (avgMatch) {
      const column = avgMatch[1];
      data = applyWhereClause(data, sql);
      const sum = data.reduce((acc, row) => acc + (Number(row[column]) || 0), 0);
      const avg = data.length > 0 ? sum / data.length : 0;
      return [{ avg: Math.round(avg * 100) / 100 }];
    }
  }

  // Handle MAX queries
  if (sql.includes('max(')) {
    const maxMatch = sql.match(/max\(\s*(\w+)\s*\)/i);
    if (maxMatch) {
      const column = maxMatch[1];
      data = applyWhereClause(data, sql);
      const max = Math.max(...data.map((row) => Number(row[column]) || 0));
      return [{ max }];
    }
  }

  // Handle MIN queries
  if (sql.includes('min(')) {
    const minMatch = sql.match(/min\(\s*(\w+)\s*\)/i);
    if (minMatch) {
      const column = minMatch[1];
      data = applyWhereClause(data, sql);
      const min = Math.min(...data.map((row) => Number(row[column]) || 0));
      return [{ min }];
    }
  }

  // Apply WHERE clause
  data = applyWhereClause(data, sql);

  // Apply ORDER BY
  const orderByMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
  if (orderByMatch) {
    const column = orderByMatch[1];
    const direction = (orderByMatch[2] || 'asc').toLowerCase();
    data = [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Apply LIMIT
  const limitMatch = sql.match(/limit\s+(\d+)/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    data = data.slice(0, limit);
  }

  return data;
}

/**
 * Apply WHERE clause filters to data
 */
function applyWhereClause(data: MockDataRecord[], sql: string): MockDataRecord[] {
  const whereMatch = sql.match(/where\s+(.+?)(?:\s+group|\s+order|\s+limit|$)/i);
  if (!whereMatch) return data;

  const whereClause = whereMatch[1];

  // Handle multiple conditions with AND
  const conditions = whereClause.split(/\s+and\s+/i);

  return data.filter((row) => {
    return conditions.every((condition) => {
      // Handle LIKE
      const likeMatch = condition.match(/(\w+)\s+like\s+'%?([^%']+)%?'/i);
      if (likeMatch) {
        const column = likeMatch[1];
        const value = likeMatch[2].toLowerCase();
        const rowValue = String(row[column] ?? '').toLowerCase();
        return rowValue.includes(value);
      }

      // Handle equals with string
      const equalsStringMatch = condition.match(/(\w+)\s*=\s*'([^']+)'/i);
      if (equalsStringMatch) {
        const column = equalsStringMatch[1];
        const value = equalsStringMatch[2].toLowerCase();
        const rowValue = String(row[column] ?? '').toLowerCase();
        return rowValue === value;
      }

      // Handle equals with number
      const equalsNumberMatch = condition.match(/(\w+)\s*=\s*(\d+(?:\.\d+)?)/i);
      if (equalsNumberMatch) {
        const column = equalsNumberMatch[1];
        const value = parseFloat(equalsNumberMatch[2]);
        return row[column] === value;
      }

      // Handle greater than
      const gtMatch = condition.match(/(\w+)\s*>\s*(\d+(?:\.\d+)?)/i);
      if (gtMatch) {
        const column = gtMatch[1];
        const value = parseFloat(gtMatch[2]);
        return (Number(row[column]) || 0) > value;
      }

      // Handle less than
      const ltMatch = condition.match(/(\w+)\s*<\s*(\d+(?:\.\d+)?)/i);
      if (ltMatch) {
        const column = ltMatch[1];
        const value = parseFloat(ltMatch[2]);
        return (Number(row[column]) || 0) < value;
      }

      // Handle greater than or equal
      const gteMatch = condition.match(/(\w+)\s*>=\s*(\d+(?:\.\d+)?)/i);
      if (gteMatch) {
        const column = gteMatch[1];
        const value = parseFloat(gteMatch[2]);
        return (Number(row[column]) || 0) >= value;
      }

      // Handle less than or equal
      const lteMatch = condition.match(/(\w+)\s*<=\s*(\d+(?:\.\d+)?)/i);
      if (lteMatch) {
        const column = lteMatch[1];
        const value = parseFloat(lteMatch[2]);
        return (Number(row[column]) || 0) <= value;
      }

      // Handle IN clause
      const inMatch = condition.match(/(\w+)\s+in\s*\(([^)]+)\)/i);
      if (inMatch) {
        const column = inMatch[1];
        const values = inMatch[2].split(',').map((v) => v.trim().replace(/'/g, '').toLowerCase());
        const rowValue = String(row[column] ?? '').toLowerCase();
        return values.includes(rowValue);
      }

      return true;
    });
  });
}

/**
 * Get data from a specific table (wrapper for executeQuery)
 */
export async function getTableData(
  tableName: string,
  limit?: number
): Promise<MockDataRecord[]> {
  const result = await executeQuery(tableName, { limit });
  return result.data;
}

/**
 * Check if a table exists
 */
export function tableExists(tableName: string): boolean {
  return tableName.toLowerCase() in MOCK_DATA;
}

/**
 * Get current database mode
 */
export function getDatabaseMode(): 'production' | 'demo' {
  return isDemoMode() ? 'demo' : 'production';
}

/**
 * Get query statistics for monitoring
 */
export function getQueryStats(): QueryStats & { mode: 'production' | 'demo' } {
  return {
    ...queryStats,
    mode: getDatabaseMode(),
  };
}

/**
 * Reset query statistics (useful for testing)
 */
export function resetQueryStats(): void {
  queryStats.totalQueries = 0;
  queryStats.mockQueries = 0;
  queryStats.supabaseQueries = 0;
  queryStats.failedQueries = 0;
  queryStats.lastQueryTime = 0;
}

/**
 * Get database health status
 */
export async function getDatabaseHealth(): Promise<{
  healthy: boolean;
  mode: 'production' | 'demo';
  message: string;
  stats: QueryStats;
}> {
  const mode = getDatabaseMode();

  if (mode === 'demo') {
    return {
      healthy: true,
      mode: 'demo',
      message: 'Operando em modo demo com dados mock. Para usar banco real, configure SUPABASE_URL e SUPABASE_ANON_KEY.',
      stats: queryStats,
    };
  }

  // Test Supabase connection
  try {
    const client = getClient();
    if (!client) {
      return {
        healthy: false,
        mode: 'production',
        message: 'Cliente Supabase nao disponivel.',
        stats: queryStats,
      };
    }

    // Try a simple query to test connection
    const { error } = await client.from('_health_check').select('*').limit(1);

    // If table doesn't exist, connection still works
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    return {
      healthy: true,
      mode: 'production',
      message: 'Conexao com Supabase estabelecida.',
      stats: queryStats,
    };
  } catch (error) {
    return {
      healthy: false,
      mode: 'production',
      message: `Erro ao conectar com Supabase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      stats: queryStats,
    };
  }
}

export default {
  getAllTables,
  getTableSchema,
  getAllTableSchemas,
  executeQuery,
  executeRawQuery,
  getTableData,
  tableExists,
  getDatabaseMode,
  getQueryStats,
  resetQueryStats,
  getDatabaseHealth,
};
