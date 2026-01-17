Crie um sistema completo de agente de IA que permite conversar com bases de dados através de uma interface web moderna. O sistema deve ter:

## 🎯 FUNCIONALIDADES PRINCIPAIS:

### 1. Interface Dupla:
- **Tabela de dados**: Exibição visual dos dados em formato de tabela interativa
- **Chat conversacional**: Interface de chat onde o usuário pode fazer perguntas em linguagem natural sobre os dados

### 2. Conexão com Banco de Dados:
- Integração com Supabase (PostgreSQL)
- Suporte para múltiplas tabelas/bases de dados
- Configuração flexível de conexão

### 3. Processamento de Linguagem Natural:
- O usuário pode perguntar coisas como:
  - "Quantas transações foram aprovadas este mês?"
  - "Mostre os produtos mais vendidos"
  - "Qual o valor total das vendas por cliente?"
  - "Filtre apenas transações canceladas"
  - "Agrupe por produto e some os valores"

### 4. Funcionalidades da Tabela:
- Filtros dinâmicos baseados nas perguntas do chat
- Paginação
- Ordenação por colunas
- Busca em tempo real
- Export para CSV/Excel

## 🛠️ STACK TECNOLÓGICA:

### Frontend:
- **React** com hooks modernos
- **TailwindCSS** para estilização
- **Lucide React** para ícones
- **Recharts** para gráficos (quando necessário)

### Backend/API:
- **Node.js** com Express
- **Supabase Client** para conexão com BD
- **OpenAI API** ou **Anthropic Claude API** para processamento de linguagem natural

### Banco de Dados:
- **Supabase** (PostgreSQL)
- Estrutura preparada para múltiplas tabelas

## 🎨 DESIGN DA INTERFACE:

### Layout:

─────────────────────────────────────────────┐
│  🤖 AI Data Assistant                       │
├─────────────────┬───────────────────────────┤
│                 │  💬 Chat                  │
│  📊 Data Table  │  ┌─────────────────────┐   │
│                 │  │ User: Quantos       │   │
│  [Table View]   │  │ pedidos aprovados?  │   │
│                 │  └─────────────────────┘   │
│                 │  ┌─────────────────────┐   │
│                 │  │ AI: Encontrei 247   │   │
│                 │  │ pedidos aprovados   │   │
│                 │  │ [Filtros aplicados] │   │
│                 │  └─────────────────────┘   │
└─────────────────┴───────────────────────────┘

## 📋 REQUISITOS ESPECÍFICOS:

### 1. Sistema de Chat:
- Input de texto para perguntas
- Histórico de conversas
- Indicador de "digitando..."
- Respostas com contexto dos dados
- Botões de sugestões de perguntas

### 2. Integração Inteligente:
- Quando o usuário faz uma pergunta, o sistema deve:
  1. Processar a pergunta em linguagem natural
  2. Gerar SQL query apropriada
  3. Executar query no Supabase
  4. Atualizar a tabela com os resultados
  5. Responder no chat com insights

### 3. Funcionalidades Avançadas:
- Reconhecimento de intenções (filtrar, agrupar, somar, contar, etc.)
- Geração automática de gráficos quando apropriado
- Salvamento de queries favoritas
- Histórico de perguntas

### 4. Configuração:
- Arquivo de configuração para conexão com Supabase
- Mapeamento de colunas e tabelas
- Configuração de permissões de acesso

## 🔧 ESTRUTURA DO PROJETO:

project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DataTable.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── supabase.js
│   │   └── utils/
│   │       └── queryParser.js
├── backend/
│   ├── routes/
│   │   ├── chat.js
│   │   └── data.js
│   ├── services/
│   │   ├── nlp.js
│   │   └── database.js
│   └── config/
│       └── supabase.js
└── README.md

## 🎯 EXEMPLO DE USO:

**Usuário pergunta**: "Mostre apenas as transações aprovadas dos últimos 30 dias"

**Sistema responde**: 
1. Processa a pergunta
2. Gera SQL: `SELECT * FROM transactions WHERE status = 'Aprovado' AND date >= NOW() - INTERVAL '30 days'`
3. Executa query
4. Atualiza tabela com filtros
5. Responde: "Encontrei 156 transações aprovadas nos últimos 30 dias. A tabela foi atualizada com os filtros aplicados."

## 📦 ENTREGÁVEIS:

1. **Código fonte completo** (Frontend + Backend)
2. **Configuração do Supabase** com tabelas de exemplo
3. **Documentação** de instalação e uso
4. **Arquivo .env.example** com variáveis necessárias
5. **Scripts de build** e deploy

## 🚀 INSTRUÇÕES ADICIONAIS:

- Use TypeScript se possível para melhor tipagem
- Implemente tratamento de erros robusto
- Adicione loading states e feedback visual
- Garanta responsividade mobile
- Implemente autenticação básica se necessário
- Adicione testes unitários para funções críticas

Crie este sistema completo, funcional e pronto para produção!

