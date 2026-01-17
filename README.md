# PropIA Delta

Sistema de IA que permite conversar com bases de dados em linguagem natural, transformando perguntas em queries SQL e apresentando resultados de forma visual e intuitiva.

## Descricao

O PropIA Delta e uma aplicacao full-stack que combina o poder da inteligencia artificial com a flexibilidade de consultas a banco de dados. Os usuarios podem fazer perguntas em linguagem natural sobre seus dados e receber respostas precisas, visualizacoes e insights automaticos.

## Features

- **Interface Dupla (Tabela + Chat)**: Visualize dados em formato tabular enquanto interage via chat
- **Processamento de Linguagem Natural**: Faca perguntas em portugues ou ingles sobre seus dados
- **Geracao Automatica de SQL**: A IA converte suas perguntas em queries SQL otimizadas
- **Visualizacao de Dados com Graficos**: Graficos interativos gerados automaticamente com Recharts
- **Export CSV/Excel**: Exporte seus resultados para analise externa
- **Historico de Queries**: Acesse consultas anteriores facilmente
- **Seguranca**: Protecao contra SQL injection e validacao de entrada

## Tecnologias

### Frontend
- **React 18** - Biblioteca UI moderna e performatica
- **TypeScript** - Tipagem estatica para codigo mais seguro
- **TailwindCSS** - Estilizacao utilitaria responsiva
- **Recharts** - Graficos interativos e customizaveis
- **Vite** - Build tool rapido e moderno
- **Axios** - Cliente HTTP para comunicacao com API

### Backend
- **Node.js** - Runtime JavaScript no servidor
- **Express** - Framework web minimalista e flexivel
- **TypeScript** - Tipagem estatica end-to-end
- **Zod** - Validacao de schemas e dados
- **Helmet** - Headers de seguranca HTTP
- **Morgan** - Logging de requisicoes HTTP

### Infraestrutura
- **Supabase (PostgreSQL)** - Banco de dados relacional gerenciado
- **OpenAI API** - Processamento de linguagem natural (opcional)
- **Docker** - Containerizacao para deploy consistente
- **Nginx** - Servidor web para producao

## Instalacao

### Pre-requisitos

- Node.js 20+
- npm ou yarn
- Docker e Docker Compose (para deploy)
- Conta no Supabase
- Chave da API OpenAI (opcional)

### Configuracao de Variaveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Supabase (obrigatorio)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima

# OpenAI (opcional - para geracao de SQL via IA)
OPENAI_API_KEY=sk-sua-chave-openai
```

### Desenvolvimento Local

#### Backend

```bash
# Navegue para o diretorio do backend
cd backend

# Instale as dependencias
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O backend estara disponivel em `http://localhost:4000`

#### Frontend

```bash
# Em outro terminal, navegue para o diretorio do frontend
cd frontend

# Instale as dependencias
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estara disponivel em `http://localhost:5173`

### Docker (Producao)

Para executar a aplicacao completa em containers Docker:

```bash
# Build e inicie os containers
docker-compose up --build

# Ou em modo detached (background)
docker-compose up --build -d

# Pare os containers
docker-compose down

# Visualize logs
docker-compose logs -f
```

Apos iniciar, acesse:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

## Variaveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `SUPABASE_URL` | Sim | URL do seu projeto Supabase |
| `SUPABASE_ANON_KEY` | Sim | Chave anonima do Supabase |
| `OPENAI_API_KEY` | Nao | Chave da API OpenAI para geracao de SQL |
| `NODE_ENV` | Nao | Ambiente de execucao (development/production) |
| `PORT` | Nao | Porta do servidor backend (default: 4000) |

## Uso

### Exemplos de Perguntas

O PropIA Delta entende perguntas em linguagem natural. Aqui estao alguns exemplos:

**Consultas Basicas:**
- "Quantas transacoes foram aprovadas?"
- "Mostre todos os clientes cadastrados"
- "Liste os produtos com preco maior que 100"

**Agregacoes:**
- "Qual o total de vendas por cliente?"
- "Mostre os produtos mais vendidos"
- "Qual a media de valor das transacoes?"

**Filtros e Ordenacao:**
- "Quais transacoes foram feitas no ultimo mes?"
- "Liste os 10 clientes que mais compraram"
- "Mostre vendas ordenadas por data"

**Analises:**
- "Compare as vendas entre os meses"
- "Qual o produto com maior margem de lucro?"
- "Identifique clientes inativos ha mais de 6 meses"

## Documentacao da API

### Swagger UI

A documentacao interativa da API esta disponivel em:

```
http://localhost:4000/api/docs
```

Acesse para explorar todos os endpoints, testar requisicoes e ver schemas de dados.

### OpenAPI Spec

O arquivo OpenAPI JSON esta disponivel em:

```
http://localhost:4000/api/docs/openapi.json
```

## API Endpoints

### Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuario |
| POST | `/api/auth/login` | Autenticar usuario |
| POST | `/api/auth/logout` | Encerrar sessao |
| GET | `/api/auth/me` | Obter usuario atual |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/status` | Status do servico de auth |

### Chat (Linguagem Natural)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/chat` | Processar pergunta em linguagem natural |
| GET | `/api/chat/suggestions` | Obter sugestoes de perguntas |
| GET | `/api/chat/history` | Obter historico de conversas |

**Exemplo de Requisicao:**

```http
POST /api/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Quantas transacoes foram aprovadas?",
  "context": {
    "tableName": "transactions"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Encontrei **15** transacoes aprovadas.",
    "sqlQuery": "SELECT COUNT(*) as count FROM transactions WHERE status = 'Aprovado'",
    "data": [{ "count": 15 }],
    "chartData": {
      "type": "bar",
      "title": "Total de Transacoes Aprovadas",
      "labels": ["Total"],
      "datasets": [{ "label": "Quantidade", "data": [15] }]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Dados

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/data/tables` | Listar todas as tabelas |
| GET | `/api/data/schemas` | Obter schemas de todas tabelas |
| GET | `/api/data/:tableName` | Obter dados de uma tabela |
| GET | `/api/data/:tableName/schema` | Obter schema de uma tabela |
| GET | `/api/data/:tableName/stats` | Obter estatisticas de uma tabela |
| GET | `/api/data/:tableName/distinct/:column` | Obter valores distintos |

**Parametros de Query (GET /api/data/:tableName):**

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `limit` | number | Numero maximo de registros (default: 100, max: 1000) |
| `offset` | number | Registros a pular para paginacao |
| `orderBy` | string | Coluna para ordenacao |
| `order` | string | Direcao: ASC ou DESC |
| `status` | string | Filtrar por status |
| `category` | string | Filtrar por categoria |
| `city` | string | Filtrar por cidade |

### Health Check

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/health` | Status detalhado da API e servicos |
| GET | `/api/status` | Lista de endpoints disponiveis |

**Exemplo de Health Check:**

```http
GET /api/health
```

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": { "mode": "demo", "connected": true },
    "openai": { "configured": false, "mode": "rules" },
    "auth": { "mode": "demo" }
  }
}
```

## Testes

### Frontend

```bash
cd frontend

# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage
```

### Backend

```bash
cd backend

# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage
```

## Arquitetura

```
ai-data-assistant/
├── frontend/                 # Aplicacao React
│   ├── src/
│   │   ├── components/      # Componentes reutilizaveis
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicos de API
│   │   ├── types/           # Definicoes TypeScript
│   │   └── utils/           # Funcoes utilitarias
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # API Express
│   ├── src/
│   │   ├── controllers/     # Controladores de rotas
│   │   ├── services/        # Logica de negocios
│   │   ├── middleware/      # Middlewares Express
│   │   ├── routes/          # Definicao de rotas
│   │   └── utils/           # Funcoes utilitarias
│   └── Dockerfile
│
├── docker-compose.yml        # Orquestracao Docker
├── .env.example             # Exemplo de variaveis de ambiente
└── README.md                # Este arquivo
```

## Contribuindo

1. Faca um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudancas (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

Consulte o arquivo `CONTRIBUTING.md` para mais detalhes.

## Licenca

Este projeto esta licenciado sob a licenca MIT - veja o arquivo `LICENSE` para detalhes.

## Suporte

Se voce encontrar algum problema ou tiver sugestoes, por favor abra uma issue no repositorio.
