# Plano Técnico - Sistema de Quadros Kanban

## 1. Visão Geral da Arquitetura

Sistema arquitetonado em **arquitetura cliente-servidor** com separação clara entre camadas:

- **Front-end**: Aplicação React (SPA) executada no navegador
- **Back-end**: API REST em Node.js/TypeScript com Express
- **Banco de dados**: PostgreSQL com TypeORM como camada ORM
- **Autenticação**: JWT (JSON Web Token) armazenado em cookie seguro ou localStorage

Comunicação síncrona via HTTP REST. Futuras versões podem incorporar WebSockets para atualizações em tempo real.

---

## 2. Stack Tecnológico

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **ORM**: TypeORM (com migrações automáticas)
- **Banco de Dados**: PostgreSQL (v12+)
- **Autenticação**: JWT com biblioteca `jsonwebtoken`
- **Validação**: Class-validator e class-transformer para DTOs
- **Hashing**: bcryptjs para senhas
- **Logging**: winston ou console estruturado
- **Testes**: Jest (opcional nesta fase)

### Frontend
- **Framework**: React 18+
- **Linguagem**: TypeScript
- **State Management**: Context API ou Redux (a definir)
- **HTTP Client**: Axios ou Fetch API
- **UI Components**: Material-UI ou componentes customizados (conforme protótipo)
- **Drag-and-Drop**: react-beautiful-dnd ou react-dnd
- **Ícones**: react-icons
- **Validação**: Zod ou react-hook-form

### Infra
- **Containerização**: Docker + Docker Compose (desenvolvimento)
- **Version Control**: Git
- **CI/CD**: GitHub Actions (optional para futuro)

---

## 3. Arquitetura de Componentes

### 3.1 Back-end: Estrutura de Pastas

```
backend/
├── src/
│   ├── config/              # Configurações (DB, env, JWT)
│   ├── controllers/         # Controladores (request handlers)
│   ├── services/            # Lógica de negócio
│   ├── repositories/        # Acesso a dados (padrão repositório)
│   ├── entities/            # Entidades do banco (User, Board, etc)
│   ├── middleware/          # Middlewares (auth, error handling)
│   ├── dtos/                # Data Transfer Objects (request/response)
│   ├── utils/               # Utilitários (validação, helpers)
│   ├── routes/              # Definição de rotas
│   ├── app.ts               # Instância Express
│   └── main.ts              # Entry point
├── migrations/              # Migrações TypeORM
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

### 3.2 Camadas Back-end

**1. Route Layer**
- Define endpoints HTTP
- Delega para controladores
- Tratamento de erros centralizado

**2. Controller Layer**
- Recebe requisição HTTP
- Valida entrada (DTO)
- Chama serviço
- Retorna resposta JSON

**3. Service Layer**
- Lógica de negócio
- Validações de regras
- Orquestra repositórios
- Mantém transações

**4. Repository Layer**
- Operações CRUD
- Queries customizadas
- Abstração de banco

**5. Entity Layer**
- Modelos TypeORM
- Decoradores (coluna, relação, validação)
- Representação banco de dados

### 3.3 Front-end: Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Layout/          # Header, Sidebar, etc
│   │   ├── Board/           # Componentes de quadro
│   │   ├── Card/            # Componentes de card
│   │   ├── Modal/           # Modais
│   │   └── Common/          # Botões, inputs reutilizáveis
│   ├── pages/               # Páginas (Login, Register, Boards, etc)
│   ├── services/            # Serviços HTTP (chamadas API)
│   ├── context/             # Context API para estado global
│   ├── hooks/               # Custom hooks
│   ├── types/               # Tipos TypeScript
│   ├── styles/              # CSS global, temas
│   ├── utils/               # Utilitários (formatação, etc)
│   ├── App.tsx              # Componente raiz
│   └── main.tsx             # Entry point
├── public/                  # Assets estáticos
├── package.json
└── tsconfig.json
```

### 3.4 Componentes Front-end Principais

- **AuthLayout**: Layout para login/registro
- **BoardList**: Lista de quadros do usuário
- **BoardView**: Visualização principal do quadro (listas e cards)
- **CardModal**: Modal de detalhe do card
- **ListHeader**: Header de cada lista (nome, ações)
- **CardItem**: Componente individual de card (renderizado em lista)
- **MemberModal**: Modal para gerenciar membros
- **LabelModal**: Modal para gerenciar etiquetas
- **ChecklistSection**: Seção de checklists dentro de card

---

## 4. Modelos de Dados

### 4.1 Diagrama Entidade-Relacionamento (ER)

```
User
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE, NOT NULL)
├── password (VARCHAR, NOT NULL) [hasheado]
├── name (VARCHAR, NOT NULL)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

Board
├── id (UUID, PK)
├── name (VARCHAR, NOT NULL)
├── ownerId (UUID, FK -> User)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

BoardMember (relação muitos-para-muitos entre User e Board)
├── id (UUID, PK)
├── boardId (UUID, FK -> Board)
├── userId (UUID, FK -> User)
├── role (ENUM: OWNER, ADMIN, MEMBER, OBSERVER)
├── joinedAt (TIMESTAMP)

List
├── id (UUID, PK)
├── boardId (UUID, FK -> Board)
├── name (VARCHAR, NOT NULL)
├── order (INTEGER) [para reordenação]
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

Card
├── id (UUID, PK)
├── listId (UUID, FK -> List)
├── title (VARCHAR, NOT NULL)
├── description (TEXT)
├── dueDate (DATE)
├── order (INTEGER) [para reordenação]
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

CardMember (relação muitos-para-muitos)
├── id (UUID, PK)
├── cardId (UUID, FK -> Card)
├── userId (UUID, FK -> User)
├── assignedAt (TIMESTAMP)

Checklist
├── id (UUID, PK)
├── cardId (UUID, FK -> Card)
├── title (VARCHAR, NOT NULL)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

ChecklistItem
├── id (UUID, PK)
├── checklistId (UUID, FK -> Checklist)
├── text (VARCHAR, NOT NULL)
├── completed (BOOLEAN, DEFAULT FALSE)
├── order (INTEGER)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

Label
├── id (UUID, PK)
├── boardId (UUID, FK -> Board)
├── name (VARCHAR, NOT NULL)
├── color (VARCHAR) [ex: "#FF5733"]
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

CardLabel (relação muitos-para-muitos)
├── id (UUID, PK)
├── cardId (UUID, FK -> Card)
├── labelId (UUID, FK -> Label)

Comment
├── id (UUID, PK)
├── cardId (UUID, FK -> Card)
├── authorId (UUID, FK -> User)
├── text (TEXT, NOT NULL)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP) [atualizado se editado]
├── deletedAt (TIMESTAMP) [soft delete, opcional]

Invite
├── id (UUID, PK)
├── boardId (UUID, FK -> Board)
├── email (VARCHAR, NOT NULL)
├── role (ENUM: MEMBER, OBSERVER)
├── token (VARCHAR, UNIQUE) [para link de aceite]
├── expiresAt (TIMESTAMP)
├── createdBy (UUID, FK -> User)
├── createdAt (TIMESTAMP)
├── acceptedAt (TIMESTAMP) [NULL até aceitar]
```

### 4.2 Constraints e Índices

**Índices Críticos:**
- `User.email` (UNIQUE)
- `Board.ownerId` (para queries rápidas de quadros por owner)
- `BoardMember(boardId, userId)` (UNIQUE, para evitar duplicatas)
- `List.boardId` (para queries de listas por quadro)
- `Card.listId` (para queries de cards por lista)
- `Comment.cardId` (para queries de comentários por card)
- `Label.boardId` (para queries de labels por quadro)

**Cascatas:**
- DELETE Board → DELETE Lists, Cards, BoardMembers, Labels, Invites
- DELETE List → DELETE Cards, CardMembers (mover ou deletar conforme spec)
- DELETE Card → DELETE Checklists, Comments, CardMembers, CardLabels
- DELETE Checklist → DELETE ChecklistItems
- DELETE User → (manter referências, apenas anular membro se removido)

**Constraints:**
- User.email: NOT NULL, UNIQUE
- Board.name, List.name, Card.title: NOT NULL
- BoardMember.role: valores ENUM limitados
- Card.dueDate: pode ser NULL
- Comment.text: NOT NULL

---

## 5. Interfaces e Contratos

### 5.1 Padrão de Resposta HTTP

**Sucesso (2xx):**
```json
{
  "success": true,
  "data": { /* entidade ou array */ },
  "message": "Operação realizada com sucesso"
}
```

**Erro (4xx/5xx):**
```json
{
  "success": false,
  "error": "error_code",
  "message": "Descrição legível do erro",
  "details": { /* validações detalhadas, opcional */ }
}
```

### 5.2 Endpoints da API

#### Autenticação
```
POST   /api/auth/register          # Cadastro
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
GET    /api/auth/me                # Dados do usuário autenticado
POST   /api/auth/refresh           # Refresh token (se usar refresh tokens)
```

#### Quadros
```
GET    /api/boards                 # Listar meus quadros
POST   /api/boards                 # Criar novo quadro
GET    /api/boards/:boardId        # Detalhe do quadro
PATCH  /api/boards/:boardId        # Editar quadro
DELETE /api/boards/:boardId        # Deletar quadro

GET    /api/boards/:boardId/members          # Listar membros
POST   /api/boards/:boardId/members/invite   # Convidar membro
PATCH  /api/boards/:boardId/members/:userId  # Alterar papel
DELETE /api/boards/:boardId/members/:userId  # Remover membro

GET    /api/boards/:boardId/invites          # Listar convites pendentes
POST   /api/invites/:inviteId/accept         # Aceitar convite
DELETE /api/invites/:inviteId                # Rejeitar/revogar convite

GET    /api/boards/:boardId/labels           # Listar labels
POST   /api/boards/:boardId/labels           # Criar label
DELETE /api/boards/:boardId/labels/:labelId  # Deletar label
```

#### Listas
```
POST   /api/boards/:boardId/lists            # Criar lista
PATCH  /api/lists/:listId                    # Editar nome
PATCH  /api/lists/:listId/order              # Reordenar listas
DELETE /api/lists/:listId                    # Deletar lista
```

#### Cards
```
POST   /api/lists/:listId/cards              # Criar card
GET    /api/cards/:cardId                    # Detalhe do card
PATCH  /api/cards/:cardId                    # Editar card (título, descrição, dueDate)
DELETE /api/cards/:cardId                    # Deletar card
PATCH  /api/cards/:cardId/list               # Mover card para outra lista
PATCH  /api/cards/:cardId/order              # Reordenar cards dentro de lista

POST   /api/cards/:cardId/members            # Atribuir membro
DELETE /api/cards/:cardId/members/:userId    # Remover atribuição

POST   /api/cards/:cardId/labels             # Adicionar label
DELETE /api/cards/:cardId/labels/:labelId    # Remover label
```

#### Checklists
```
POST   /api/cards/:cardId/checklists         # Criar checklist
PATCH  /api/checklists/:checklistId          # Editar nome do checklist
DELETE /api/checklists/:checklistId          # Deletar checklist

POST   /api/checklists/:checklistId/items    # Adicionar item
PATCH  /api/items/:itemId                    # Editar/marcar item
DELETE /api/items/:itemId                    # Deletar item
```

#### Comentários
```
POST   /api/cards/:cardId/comments           # Criar comentário
PATCH  /api/comments/:commentId              # Editar comentário
DELETE /api/comments/:commentId              # Deletar comentário
GET    /api/cards/:cardId/comments           # Listar comentários (incluído em GET card)
```

#### Filtros (queries úteis)
```
GET    /api/boards/:boardId?filterLabels=label1,label2   # Filtrar por labels
GET    /api/boards/:boardId?assignedTo=userId            # Filtrar por atribuição
GET    /api/boards/:boardId?overdue=true                 # Filtrar atrasados
```

### 5.3 Estrutura de DTOs Principais

**Auth**
```typescript
// Login Request
{ email: string, password: string }

// Register Request
{ email: string, password: string, name: string }

// Auth Response
{ token: string, user: { id, email, name } }
```

**Board**
```typescript
// Create/Update Request
{ name: string }

// Board Response
{ id, name, ownerId, members: [...], lists: [...], labels: [...], createdAt, updatedAt }
```

**Card**
```typescript
// Create Request
{ title: string, listId: string }

// Update Request
{ title?: string, description?: string, dueDate?: Date }

// Card Response (com todas relações)
{ 
  id, title, description, dueDate, listId, 
  members: [...], 
  labels: [...], 
  checklists: [...], 
  comments: [...],
  createdAt, updatedAt 
}
```

---

## 6. Autenticação e Autorização

### 6.1 Fluxo de Autenticação

1. **Registro/Login**: Usuário envia email + senha
2. **Validação**: Backend valida credenciais (senha com bcrypt)
3. **Token**: Backend gera JWT com `userId` e `role` (se aplicável)
4. **Armazenamento**: Token armazenado em cookie seguro (httpOnly) ou localStorage
5. **Requisições Subsequentes**: Token enviado no header `Authorization: Bearer <token>`
6. **Validação de Requeste**: Middleware de autenticação valida token em cada requisição

### 6.2 JWT Payload

```typescript
{
  userId: string,
  email: string,
  iat: number,           // issued at
  exp: number            // expires at (ex: 30 dias)
}
```

### 6.3 Autorização Baseada em Papéis

**Papéis globais**: Usuário é membro de um board com papel específico.

**Verificação**:
- Middleware checa token e extrai `userId`
- Service verifica `BoardMember` table para permission check
- Ações bloqueadas se usuário não tem papel necessário

**Exemplo: Deletar board**
- Apenas OWNER ou ADMIN pode
- Middleware/Service valida antes de executar

**Exemplo: Editar card**
- Qualquer MEMBER ou ADMIN pode
- Observador (OBSERVER) não pode

### 6.4 Armazenamento de Senha

- Senhas **nunca** são armazenadas em plain text
- Usar bcryptjs com salt rounds 10+
- Hash é verificado no login, não a senha original

---

## 7. Segurança

### 7.1 HTTPS/TLS
- Em produção, sempre HTTPS
- Cookies com flag `Secure` e `HttpOnly`
- CORS configurado para domínios autorizados

### 7.2 Proteção CSRF
- Se usar cookies, implementar CSRF tokens (double-submit cookie ou SameSite)
- Se usar JWT em localStorage, CSRF é menos crítico

### 7.3 Validação de Entrada
- Todas as entradas são validadas em DTOs
- Sanitização de strings para prevenir XSS
- Limites de tamanho (ex: título máx 255 chars)

### 7.4 Rate Limiting
- Limitar requisições de login/registro (ex: 5 tentativas por IP por minuto)
- Limite geral de requisições por usuário (ex: 100 req/min)

### 7.5 Proteção de Dados
- Senhas: bcrypt
- Dados sensíveis: não logar tokens ou senhas
- Soft-delete para comentários (não deletar imediatamente) - opcional

### 7.6 Controle de Acesso
- Usuário só acessa dados de quadros que é membro
- Validar `boardId` em todas requisições relacionadas
- Bloqueios de operações não permitidas por papel

---

## 8. Performance

### 8.1 Otimizações de Banco de Dados

- **Índices**: Todos conforme seção 4.2
- **N+1 Queries**: Usar Eager Loading (TypeORM `leftJoinAndSelect`)
- **Paginação**: Implementar para listas grandes (ex: comentários, histórico)
- **Query Optimization**: Selecionar apenas colunas necessárias

**Exemplo de query otimizada (GET board completo):**
```
SELECT * FROM boards 
LEFT JOIN lists ON boards.id = lists.boardId 
LEFT JOIN cards ON lists.id = cards.listId 
LEFT JOIN board_members ON boards.id = board_members.boardId 
WHERE boards.id = ? 
ORDER BY lists.order, cards.order
```

### 8.2 Cache (Futuro)
- Redis para sessões (opcional)
- Cache de boards para usuários frequentes
- Invalidação ao modificar dados

### 8.3 Compressão
- GZIP compression em respostas JSON
- Minificação de assets front-end

### 8.4 Lazy Loading Front-end
- Code splitting de componentes
- Carregamento de imagens com lazy-load

---

## 9. Escalabilidade

### 9.1 Stateless Back-end
- Backend não mantém estado de sessão (JWT é stateless)
- Permite múltiplas instâncias atrás de load balancer

### 9.2 Banco de Dados
- PostgreSQL escala verticamente (mais CPU/RAM)
- Futuro: read replicas para queries de leitura
- Particionamento de tabelas grandes se necessário (ex: comments, audit logs)

### 9.3 Arquitetura Distribuída (Futuro)
- Separar serviços por domínio (Auth, Boards, Cards, etc)
- Message queue para operações assíncronas
- WebSockets para atualizações real-time

---

## 10. Requisitos Não Funcionais

### 10.1 Disponibilidade
- SLA: 99.5% uptime desejado
- Backup automático do banco de dados (diário)
- Recuperação de falhas em < 5 minutos

### 10.2 Latência
- Tempo de resposta API: < 200ms (p95)
- Tempo de carregamento de página: < 3s (p95)

### 10.3 Throughput
- Suportar 100+ usuários simultâneos
- 1000+ requisições/hora

### 10.4 Armazenamento
- Cada quadro pode ter até 10.000 cards (sem limite técnico específico)
- Comentários podem ser paginados

### 10.5 Compliance
- LGPD: Direito de exclusão (hard delete de dados pessoais)
- Audit log: Rastrear quem fez o quê e quando (opcional fase 1)

---

## 11. Restrições de Implementação

### 11.1 Restrições Arquiteturais

1. **Separação de Camadas**: Backend deve seguir padrão Controller → Service → Repository.
2. **Tipos TypeScript**: Usar tipos explícitos em funções, sem `any`.
3. **Validação Centralizada**: DTOs com decoradores (class-validator) são obrigatórios.
4. **Transações**: Operações que envolvem múltiplas tabelas devem ser transacionadas (ex: deletar quadro).
5. **Autenticação**: Todos endpoints protegidos (exceto login/register) exigem token válido.

### 11.2 Restrições de Banco de Dados

1. **UUID para PKs**: Usar UUID v4 para todas chaves primárias (não usar AUTO_INCREMENT).
2. **Soft Delete**: Comentários podem usar soft delete (deletedAt) se auditoria for necessária.
3. **Cascade Rules**: Deletar board deleta cascata (lists, cards, etc). Deletar list: confirmar ação em card.
4. **Timestamps**: Todo entity tem `createdAt` e `updatedAt` automaticamente.
5. **Constraints**: Respeitar as constraints listadas em 4.2.

### 11.3 Restrições de Front-end

1. **State Management**: Usar Context API ou Redux (consistentemente, não misturar).
2. **Componentes**: Reutilizar componentes, evitar duplicação.
3. **Tipos**: TypeScript obrigatório, sem tipagem implícita.
4. **Acessibilidade**: Labels associadas a inputs, cores contrastadas (WCAG 2.1 AA).
5. **Responsividade**: Suportar viewport mínimo 320px (mobile).

### 11.4 Restrições de Segurança

1. **Senhas**: Sempre hasheadas com bcrypt, nunca em plain text.
2. **Tokens**: Validade máxima 30 dias, refresh opcional.
3. **CORS**: Configurado apenas para domínios de origem autorizado.
4. **Validação**: Toda entrada do usuário é validada no backend.
5. **Logs**: Nunca logar tokens, senhas ou dados sensíveis.

### 11.5 Restrições de Testes

1. **Unit Tests**: Services e utilities devem ter testes (opcional para MVP).
2. **Sem Testes de API Funcional**: Conforme contexto, não executar fluxo completo.
3. **Build**: `tsc` deve passar sem erros. `npm run build` deve gerar artifacts sem warning.

---

## 12. Decisões Arquiteturais Justificadas

| Decisão | Justificativa |
|---------|---------------|
| REST API | Simples, stateless, fácil de debugar. WebSockets futuros se tempo real crítico |
| JWT | Stateless, escalável, não precisa sessão servidor |
| PostgreSQL | ACID, relações complexas, confiável, familiar ao contexto |
| TypeORM | Type-safe, migrações automáticas, sintaxe limpa |
| Express | Leve, middleware, vasto ecossistema |
| React | SPA moderna, component-based, reusable |
| UUID PKs | Evita collision em distribuído, não expõe sequência de IDs |
| Soft Delete (opcional) | Auditoria sem perder histórico |

---

## 13. Integração com Stack Existente

- **Backend**: Já usa Express + TypeORM + PostgreSQL (conforme contexto)
- **Frontend**: Já implementada com React (conforme prior context)
- **Docker Compose**: Usado para PostgreSQL em desenvolvimento
- **Protótipo Pencil**: Referência para UI/UX (não gera código, apenas guia visual)

---

## 14. Fluxo de Dados Exemplo: Criar Card

1. **Frontend**: Usuário preenche title → clica "Criar"
2. **HTTP**: POST `/api/lists/:listId/cards` com `{ title: "..." }`
3. **Backend (Controller)**: Valida DTO, chama CardService
4. **Backend (Service)**: 
   - Verifica se usuário é membro do quadro
   - Calcula `order` (última posição + 1)
   - Cria entidade Card em DB
5. **Backend (Repository)**: Executa INSERT
6. **Database**: Armazena card com `listId`, `title`, `order`
7. **Response**: `{ success: true, data: { id, title, listId, order, ... } }`
8. **Frontend**: Atualiza state local, renderiza card novo na UI

---

## 15. Próximas Fases (Não Escopo Atual)

- WebSockets para atualizações em tempo real
- Notificações (email, push)
- Busca global
- Histórico de alterações (audit log)
- Exportação de dados (CSV, PDF)
- Integração com serviços externos (Slack, etc)
- Modo offline com sync

---

**Versão:** 1.0  
**Data:** 2026-10-05  
**Status:** Aprovado para Implementação  
**Responsável pela Arquitetura**: Claude Haiku 4.5
