import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ChartProvider } from './contexts/ChartContext';
import './index.css';

// Encontra o elemento root no HTML
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento root nao encontrado no DOM');
}

// Cria a raiz do React e renderiza a aplicacao
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChartProvider>
          <App />
        </ChartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
