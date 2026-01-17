/**
 * Swagger/OpenAPI Configuration
 * Documentation for PropIA Delta API
 */

import type { Application } from 'express';

/**
 * OpenAPI 3.0 Specification for PropIA Delta API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PropIA Delta API',
    version: '1.0.0',
    description: `
# PropIA Delta API

Sistema de IA para consultas em linguagem natural a bancos de dados.

## Visao Geral

O PropIA Delta permite que usuarios facam perguntas em linguagem natural sobre seus dados
e recebam respostas precisas, visualizacoes e insights automaticos.

## Autenticacao

A API utiliza autenticacao JWT Bearer Token. Para endpoints protegidos, inclua o header:

\`\`\`
Authorization: Bearer <seu_token>
\`\`\`

### Modo Demo

Em modo demo, utilize as credenciais:
- Email: \`demo@example.com\`
- Senha: \`demo123\`

## Rate Limiting

Atualmente nao ha rate limiting implementado.

## Formatos de Resposta

Todas as respostas seguem o formato padrao:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

Em caso de erro:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descricao do erro"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`
    `,
    contact: {
      name: 'PropIA Delta Team',
      email: 'support@propia.delta',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000/api',
      description: 'Servidor de Desenvolvimento',
    },
    {
      url: 'https://api.propia.delta/api',
      description: 'Servidor de Producao',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Endpoints de verificacao de saude da API',
    },
    {
      name: 'Auth',
      description: 'Autenticacao e gerenciamento de sessao',
    },
    {
      name: 'Chat',
      description: 'Processamento de linguagem natural e consultas',
    },
    {
      name: 'Data',
      description: 'Acesso a dados e schemas de tabelas',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar saude da API',
        description: 'Retorna o status de saude da API e seus servicos dependentes',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'API funcionando corretamente',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                example: {
                  status: 'ok',
                  timestamp: '2024-01-15T10:30:00.000Z',
                  environment: 'development',
                  version: '1.0.0',
                  uptime: 3600,
                  services: {
                    database: {
                      mode: 'demo',
                      configured: true,
                      connected: true,
                    },
                    openai: {
                      configured: false,
                      mode: 'rules',
                    },
                    auth: {
                      configured: true,
                      mode: 'demo',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/status': {
      get: {
        tags: ['Health'],
        summary: 'Status da API e endpoints disponiveis',
        description: 'Lista todos os endpoints disponiveis na API',
        operationId: 'getStatus',
        responses: {
          200: {
            description: 'Status e lista de endpoints',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StatusResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar novo usuario',
        description: 'Cria uma nova conta de usuario no sistema',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
              example: {
                email: 'usuario@exemplo.com',
                password: 'senhaSegura123',
                name: 'Nome do Usuario',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario registrado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          400: {
            description: 'Dados de registro invalidos',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autenticar usuario',
        description: 'Realiza login e retorna tokens de acesso',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
              example: {
                email: 'demo@example.com',
                password: 'demo123',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          401: {
            description: 'Credenciais invalidas',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Encerrar sessao',
        description: 'Realiza logout e invalida o token de acesso',
        operationId: 'logoutUser',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Logout realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
              },
            },
          },
          401: {
            description: 'Token invalido ou expirado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obter usuario atual',
        description: 'Retorna informacoes do usuario autenticado',
        operationId: 'getCurrentUser',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dados do usuario',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserResponse',
                },
              },
            },
          },
          401: {
            description: 'Nao autenticado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar token de acesso',
        description: 'Utiliza o refresh token para obter um novo access token',
        operationId: 'refreshToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RefreshRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token renovado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          401: {
            description: 'Refresh token invalido',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/status': {
      get: {
        tags: ['Auth'],
        summary: 'Status do servico de autenticacao',
        description: 'Retorna o modo de operacao do servico de autenticacao',
        operationId: 'getAuthStatus',
        responses: {
          200: {
            description: 'Status do servico',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthStatusResponse',
                },
              },
            },
          },
        },
      },
    },
    '/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Processar consulta em linguagem natural',
        description: `
Processa uma pergunta em linguagem natural e retorna dados do banco de dados.

## Exemplos de Perguntas

### Contagem
- "Quantas transacoes foram realizadas?"
- "Quantos clientes estao cadastrados?"

### Agregacoes
- "Qual o total de vendas aprovadas?"
- "Qual a media de valor das transacoes?"

### Agrupamentos
- "Quantas transacoes por status?"
- "Total de vendas por produto"

### Rankings
- "Top 5 maiores vendas"
- "Top 10 clientes"

### Filtros
- "Transacoes aprovadas"
- "Clientes de Sao Paulo"
        `,
        operationId: 'processChat',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChatRequest',
              },
              examples: {
                contagem: {
                  summary: 'Contagem simples',
                  value: {
                    message: 'Quantas transacoes foram realizadas?',
                  },
                },
                filtro: {
                  summary: 'Com filtro de status',
                  value: {
                    message: 'Mostre transacoes aprovadas',
                    context: {
                      tableName: 'transactions',
                    },
                  },
                },
                agrupamento: {
                  summary: 'Agrupamento por categoria',
                  value: {
                    message: 'Total de vendas por produto',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Consulta processada com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChatResponse',
                },
                example: {
                  success: true,
                  data: {
                    message: 'Encontrei **20** registros.',
                    sqlQuery: 'SELECT COUNT(*) as count FROM transactions',
                    data: [{ count: 20 }],
                    chartData: {
                      type: 'bar',
                      title: 'Total de Transacoes',
                      labels: ['Total'],
                      datasets: [
                        {
                          label: 'Quantidade',
                          data: [20],
                        },
                      ],
                    },
                  },
                  timestamp: '2024-01-15T10:30:00.000Z',
                },
              },
            },
          },
          400: {
            description: 'Mensagem invalida ou tabela nao encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/chat/suggestions': {
      get: {
        tags: ['Chat'],
        summary: 'Obter sugestoes de perguntas',
        description: 'Retorna uma lista de sugestoes de perguntas organizadas por categoria',
        operationId: 'getChatSuggestions',
        responses: {
          200: {
            description: 'Lista de sugestoes',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuggestionsResponse',
                },
              },
            },
          },
        },
      },
    },
    '/chat/history': {
      get: {
        tags: ['Chat'],
        summary: 'Obter historico de conversas',
        description: 'Retorna o historico de conversas do usuario (nao implementado)',
        operationId: 'getChatHistory',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Historico de conversas',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
              },
            },
          },
        },
      },
    },
    '/data/tables': {
      get: {
        tags: ['Data'],
        summary: 'Listar todas as tabelas',
        description: 'Retorna uma lista de todas as tabelas disponiveis com informacoes basicas',
        operationId: 'listTables',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de tabelas',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TablesResponse',
                },
                example: {
                  success: true,
                  data: {
                    tables: [
                      {
                        name: 'transactions',
                        displayName: 'Transacoes',
                        columnCount: 6,
                        rowCount: 20,
                      },
                      {
                        name: 'products',
                        displayName: 'Produtos',
                        columnCount: 5,
                        rowCount: 10,
                      },
                    ],
                    total: 4,
                  },
                  timestamp: '2024-01-15T10:30:00.000Z',
                },
              },
            },
          },
        },
      },
    },
    '/data/schemas': {
      get: {
        tags: ['Data'],
        summary: 'Obter schemas de todas as tabelas',
        description: 'Retorna a estrutura (colunas, tipos) de todas as tabelas',
        operationId: 'getAllSchemas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Schemas das tabelas',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SchemasResponse',
                },
              },
            },
          },
        },
      },
    },
    '/data/{tableName}': {
      get: {
        tags: ['Data'],
        summary: 'Obter dados de uma tabela',
        description: 'Retorna os dados de uma tabela especifica com suporte a paginacao e filtros',
        operationId: 'getTableData',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableName',
            in: 'path',
            required: true,
            description: 'Nome da tabela',
            schema: {
              type: 'string',
              enum: ['transactions', 'products', 'customers', 'orders'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Numero maximo de registros a retornar',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 100,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Numero de registros a pular',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0,
            },
          },
          {
            name: 'orderBy',
            in: 'query',
            description: 'Coluna para ordenacao',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'order',
            in: 'query',
            description: 'Direcao da ordenacao',
            schema: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              default: 'ASC',
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar por status',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filtrar por categoria',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'city',
            in: 'query',
            description: 'Filtrar por cidade',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Dados da tabela',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TableDataResponse',
                },
              },
            },
          },
          404: {
            description: 'Tabela nao encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/data/{tableName}/schema': {
      get: {
        tags: ['Data'],
        summary: 'Obter schema de uma tabela',
        description: 'Retorna a estrutura de colunas de uma tabela especifica',
        operationId: 'getTableSchema',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableName',
            in: 'path',
            required: true,
            description: 'Nome da tabela',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Schema da tabela',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TableSchemaResponse',
                },
              },
            },
          },
          404: {
            description: 'Tabela nao encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/data/{tableName}/stats': {
      get: {
        tags: ['Data'],
        summary: 'Obter estatisticas de uma tabela',
        description: 'Retorna estatisticas calculadas (soma, media, max, min) para colunas numericas',
        operationId: 'getTableStats',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableName',
            in: 'path',
            required: true,
            description: 'Nome da tabela',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Estatisticas da tabela',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TableStatsResponse',
                },
              },
            },
          },
          404: {
            description: 'Tabela nao encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/data/{tableName}/distinct/{column}': {
      get: {
        tags: ['Data'],
        summary: 'Obter valores distintos de uma coluna',
        description: 'Retorna todos os valores unicos de uma coluna especifica',
        operationId: 'getDistinctValues',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableName',
            in: 'path',
            required: true,
            description: 'Nome da tabela',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'column',
            in: 'path',
            required: true,
            description: 'Nome da coluna',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Valores distintos',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DistinctValuesResponse',
                },
              },
            },
          },
          400: {
            description: 'Coluna nao encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Tabela nao encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido no endpoint de login',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indica se a requisicao foi bem sucedida',
          },
          data: {
            type: 'object',
            description: 'Dados da resposta',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp da resposta',
          },
        },
        required: ['success', 'timestamp'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Codigo do erro',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                description: 'Mensagem de erro',
                example: 'Dados invalidos',
              },
              details: {
                type: 'object',
                description: 'Detalhes adicionais do erro',
              },
            },
            required: ['code', 'message'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['success', 'error', 'timestamp'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'degraded', 'error'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          environment: {
            type: 'string',
            enum: ['development', 'production', 'test'],
          },
          version: {
            type: 'string',
          },
          uptime: {
            type: 'number',
            description: 'Tempo de execucao em segundos',
          },
          services: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  mode: { type: 'string' },
                  configured: { type: 'boolean' },
                  connected: { type: 'boolean' },
                },
              },
              openai: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean' },
                  mode: { type: 'string' },
                },
              },
              auth: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean' },
                  mode: { type: 'string' },
                },
              },
            },
          },
        },
      },
      StatusResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          endpoints: {
            type: 'object',
            description: 'Lista de endpoints disponiveis',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email do usuario',
          },
          password: {
            type: 'string',
            minLength: 6,
            maxLength: 100,
            description: 'Senha (minimo 6 caracteres)',
          },
          name: {
            type: 'string',
            description: 'Nome do usuario (opcional)',
          },
        },
        required: ['email', 'password'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
          },
        },
        required: ['email', 'password'],
      },
      RefreshRequest: {
        type: 'object',
        properties: {
          refresh_token: {
            type: 'string',
            description: 'Token de refresh obtido no login',
          },
        },
        required: ['refresh_token'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              session: { $ref: '#/components/schemas/Session' },
              message: { type: 'string' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      AuthStatusResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['demo', 'supabase'],
              },
              configured: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          user_metadata: { type: 'object' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_in: { type: 'integer' },
          expires_at: { type: 'integer' },
          token_type: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      ChatRequest: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            description: 'Pergunta em linguagem natural',
          },
          context: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Nome da tabela alvo (opcional)',
              },
              conversationHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['user', 'assistant'] },
                    content: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
                description: 'Historico de mensagens anteriores',
              },
            },
          },
        },
        required: ['message'],
      },
      ChatResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Resposta em linguagem natural',
              },
              sqlQuery: {
                type: 'string',
                description: 'Query SQL gerada',
              },
              data: {
                type: 'array',
                items: { type: 'object' },
                description: 'Dados retornados pela consulta',
              },
              chartData: {
                $ref: '#/components/schemas/ChartData',
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ChartData: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['bar', 'line', 'pie', 'area', 'scatter', 'table'],
          },
          title: { type: 'string' },
          labels: {
            type: 'array',
            items: { type: 'string' },
          },
          datasets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                data: {
                  type: 'array',
                  items: { type: 'number' },
                },
                backgroundColor: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } },
                  ],
                },
                borderColor: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } },
                  ],
                },
              },
            },
          },
        },
      },
      SuggestionsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    examples: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      TablesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              tables: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    displayName: { type: 'string' },
                    columnCount: { type: 'integer' },
                    rowCount: { type: 'integer' },
                  },
                },
              },
              total: { type: 'integer' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      SchemasResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              schemas: {
                type: 'array',
                items: { $ref: '#/components/schemas/TableSchema' },
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      TableSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          displayName: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                displayName: { type: 'string' },
                type: { type: 'string' },
                nullable: { type: 'boolean' },
                isPrimaryKey: { type: 'boolean' },
                isForeignKey: { type: 'boolean' },
              },
            },
          },
          rowCount: { type: 'integer' },
        },
      },
      TableDataResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              displayName: { type: 'string' },
              rows: {
                type: 'array',
                items: { type: 'object' },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  limit: { type: 'integer' },
                  offset: { type: 'integer' },
                  hasMore: { type: 'boolean' },
                },
              },
              executionTime: { type: 'number' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      TableSchemaResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              schema: { $ref: '#/components/schemas/TableSchema' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      TableStatsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              displayName: { type: 'string' },
              stats: {
                type: 'object',
                additionalProperties: true,
                description: 'Estatisticas calculadas para cada coluna numerica',
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      DistinctValuesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              column: { type: 'string' },
              values: {
                type: 'array',
                items: {},
              },
              count: { type: 'integer' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          amount: { type: 'number' },
          status: {
            type: 'string',
            enum: ['Aprovado', 'Pendente', 'Cancelado', 'Reembolsado'],
          },
          customer: { type: 'string' },
          product: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          stock: { type: 'integer' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          city: { type: 'string' },
          total_purchases: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          customer_id: { type: 'integer' },
          product_id: { type: 'integer' },
          quantity: { type: 'integer' },
          total: { type: 'number' },
          status: {
            type: 'string',
            enum: ['Concluido', 'Pendente', 'Enviado', 'Cancelado'],
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

/**
 * Serve Swagger UI with the OpenAPI spec
 * @param app Express application
 */
export function serveSwaggerUI(app: Application): void {
  // Serve OpenAPI spec as JSON
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Serve a simple HTML page that loads Swagger UI from CDN
  app.get('/api/docs', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PropIA Delta API - Documentacao</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      color: #3B82F6;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout',
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        }
      });
    };
  </script>
</body>
</html>
    `);
  });

  console.log('  [Docs]     Swagger UI disponivel em /api/docs');
}

export default openApiSpec;
