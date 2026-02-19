# 🖥️ UST Gestão — Frontend

Interface web profissional para o sistema de gestão de orçamentos baseado em **Unidade de Serviço Técnico (UST)**.

---

## 🚀 Stack Tecnológica

| Tecnologia | Versão | Propósito |
|---|---|---|
| **React** | 18 | UI framework |
| **Vite** | 6 | Build tool ultrarrápido |
| **TypeScript** | 5 | Tipagem estática |
| **Tailwind CSS** | 3 | Estilização utility-first |
| **React Router** | 6 | Roteamento SPA |
| **TanStack Query** | 5 | Gerenciamento de estado servidor |
| **Axios** | 1.7 | HTTP client com interceptors |
| **Zustand** | 5 | Estado global (autenticação) |
| **React Hook Form** | 7 | Formulários performáticos |
| **Zod** | 3 | Validação de schemas |
| **Lucide React** | latest | Ícones |
| **react-hot-toast** | 2 | Notificações |

---

## 📁 Estrutura do Projeto

```
frontend/
├── public/
├── src/
│   ├── api/                  # Funções de chamada à API
│   │   ├── client.ts         # Instância Axios + interceptors JWT
│   │   ├── auth.ts
│   │   ├── clients.ts
│   │   ├── contracts.ts
│   │   ├── projects.ts
│   │   ├── catalog.ts
│   │   └── orders.ts
│   ├── components/
│   │   ├── layout/           # AppLayout, Sidebar, Header
│   │   ├── ui/               # Button, Input, Select, Badge, Card, Modal, Table, Spinner
│   │   └── shared/           # PageHeader, StatCard, ConfirmDialog
│   ├── lib/
│   │   └── utils.ts          # cn(), formatCurrency, formatDate, calcularUST...
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── clients/
│   │   ├── contracts/
│   │   ├── projects/
│   │   ├── catalog/
│   │   └── orders/
│   ├── store/
│   │   └── authStore.ts      # Zustand store persistido
│   ├── types/
│   │   └── index.ts          # Interfaces TypeScript (espelham schemas do backend)
│   ├── App.tsx               # Router + QueryClient + Toaster
│   ├── main.tsx
│   └── index.css             # Tailwind directives + base styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## ⚡ Como Rodar

### Pré-requisitos

- Node.js 18+
- npm 9+
- Backend FastAPI rodando em `http://localhost:8000`

### 1. Instalar dependências

```bash
cd frontend
npm install
```

### 2. Configurar variáveis de ambiente (opcional)

```bash
cp .env.example .env
```

Por padrão, o frontend aponta para `http://localhost:8000`. Se o backend estiver em outra porta, edite o `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Iniciar em desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em: **http://localhost:5173**

### 4. Build para produção

```bash
npm run build
npm run preview   # para testar o build localmente
```

---

## 🔐 Login

Credenciais padrão (criadas automaticamente pelo backend):

| Campo | Valor |
|---|---|
| Usuário | `admin` |
| Senha | `admin123` |

> ⚠️ Altere a senha em produção!

---

## 🗺️ Rotas

| Rota | Página | Acesso |
|---|---|---|
| `/login` | Tela de login | Público |
| `/dashboard` | Dashboard com stats | Autenticado |
| `/clientes` | CRUD de clientes | Autenticado |
| `/contratos` | CRUD de contratos | Autenticado |
| `/projetos` | CRUD de projetos | Autenticado |
| `/catalogo` | Catálogo hierárquico (Ciclo/Fase/Atividade) | Autenticado |
| `/orcamentos` | Lista de orçamentos com filtros | Autenticado |
| `/orcamentos/novo` | Criação de orçamento com cálculo em tempo real | Autenticado |
| `/orcamentos/:id` | Detalhe, aprovação, edição de itens e auditoria | Autenticado |

---

## 🧩 Funcionalidades

### ✅ Autenticação
- Login com JWT
- Token armazenado no `localStorage` e Zustand (persistido)
- Interceptor Axios injeta `Bearer token` em todas as requisições
- Redirect automático para `/login` em caso de `401`
- Menu de usuário com logout no header

### ✅ Dashboard
- Cards de métricas: clientes, contratos ativos, projetos, orçamentos
- Valor total aprovado em destaque
- Tabela de orçamentos recentes com link para detalhes
- Ações rápidas para as principais criações

### ✅ Clientes / Contratos / Projetos
- Listagem com busca e filtros
- Criação e edição em modal
- Deleção com confirmação
- Desativar contrato/projeto sem deletar (preserva histórico)
- Badges de status (ativo/inativo)

### ✅ Catálogo de Serviços
- Visualização em árvore hierárquica: **Ciclo → Fase → Atividade**
- Acordeão expansível por nível
- Adicionar filho direto de um item pai (contexto automático)
- Exibe complexidade UST para atividades
- Busca que filtra em todos os níveis

### ✅ Orçamentos
- Listagem com filtros por status, contrato e busca por número
- **Cálculo em tempo real** durante criação:
  - `UST item = complexidade_ust × horas_estimadas`
  - `Valor bruto = UST item × valor_ust do contrato`
  - `Valor líquido = Valor bruto − desconto`
- Painel de resumo lateral sticky com breakdown de itens
- Auto-preenchimento do contrato ao selecionar o projeto
- Detalhamento completo: tabela de itens com snapshots de complexidade
- Editar horas de um item (com auditoria)
- Alterar desconto (com auditoria e preview)
- Adicionar e remover itens em rascunho
- **Aprovação** com confirmação (torna imutável)
- Histórico de auditoria expansível na página de detalhe

---

## 🎨 Design System

### Cores
- **Primary**: `blue-600` (`#2563eb`)
- **Sidebar**: `slate-900` (`#0f172a`)
- **Background**: `slate-50` (`#f8fafc`)
- **Cards**: `white` com sombra suave

### Componentes UI próprios
Todos construídos com Tailwind CSS puro (sem dependências de component library):

- `Button` — 6 variantes (primary, secondary, ghost, danger, outline, success) × 4 tamanhos
- `Input` — com label, erro, hint, ícone esquerdo/direito
- `Select` — styled com seta customizada
- `Badge` — 7 variantes com dot opcional
- `Card` + `CardHeader` + `CardBody` + `CardFooter`
- `Modal` — portal + backdrop blur + fechar com Escape/clique fora
- `Table` + `TableHead` + `TableBody` + `TableRow` + `TableCell` + `TableEmpty`
- `Spinner` + `LoadingOverlay`
- `StatCard` — para métricas do dashboard
- `ConfirmDialog` — dialog de confirmação reutilizável
- `PageHeader` — título + descrição + slot de ações

---

## 🔄 Fluxo de Dados

```
Usuário
  ↓ Ação (click, submit)
React Hook Form / handler
  ↓ Mutation (TanStack Query)
Axios (+ Bearer token automático)
  ↓ HTTP
FastAPI Backend
  ↓ Resposta
TanStack Query cache
  ↓ Invalidação automática
React re-render
```

---

## 📡 Comunicação com a API

O cliente Axios em `src/api/client.ts` faz:

1. **Request interceptor** — injeta `Authorization: Bearer <token>` em toda requisição
2. **Response interceptor** — em caso de `401`, limpa o storage e redireciona para `/login`
3. **extractErrorMessage()** — extrai mensagem legível de qualquer erro do FastAPI (campo `detail`)

Configuração via variável de ambiente `VITE_API_URL` (padrão: `http://localhost:8000`).

---

## 🛠️ Scripts Disponíveis

```bash
npm run dev       # Servidor de desenvolvimento com HMR
npm run build     # Build de produção (TypeScript + Vite)
npm run preview   # Preview do build de produção
```

---

## 🔗 Rodando o Sistema Completo

**Terminal 1 — Backend:**
```bash
cd ex_ideiia
venv/Scripts/activate      # Windows
# source venv/bin/activate # Linux/Mac
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd ex_ideiia/frontend
npm run dev
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## 📝 Observações

- O frontend **não usa SSR** — é uma SPA pura, ideal para o backend FastAPI já pronto
- O estado de autenticação é **persistido no localStorage** via Zustand middleware
- Os cálculos UST são feitos **em tempo real no frontend** durante a criação do orçamento, usando a mesma fórmula do backend
- Todos os valores monetários são formatados com `Intl.NumberFormat` em `pt-BR` (R$)
- O sistema é **responsivo** — funciona em desktop e tablets

---

**Desenvolvido com ❤️ em React + TypeScript**