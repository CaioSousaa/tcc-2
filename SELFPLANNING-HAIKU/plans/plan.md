# Plano de Implementação - Self Planning Haiku

## Visão Geral
Implementação de duas features principais:
1. **Sistema de E-Commerce (Carrinho + Pedidos)**
2. **Sistema de Gerenciamento de Tarefas (Boards - Trello-like)**

---

## FASE 1: Sistema de E-Commerce

### 1.1 Carrinho de Compras
**Objetivo:** Usuário pode adicionar/remover produtos do carrinho com gestão automática de quantidade.

**Back-end:**
- Entidade `Cart` (vinculada a User)
- Entidade `CartItem` (vinculada a Cart e Product)
- Endpoint POST `/api/cart/add` - adiciona produto ou incrementa quantidade
- Endpoint DELETE `/api/cart/remove/:itemId` - remove item específico
- Endpoint GET `/api/cart` - lista itens com totais
- Middleware de autenticação verificando usuário

**Front-end:**
- Componente de carrinho sidebar/modal
- Botão "Adicionar ao carrinho" em produtos
- Exibição de quantidade e total
- Ícone no header com contagem de itens

---

### 1.2 Finalizar Pedido
**Objetivo:** Usuário pode checkout com cálculo automático de frete.

**Back-end:**
- Entidade `Order` (vinculada a User)
- Entidade `OrderItem` (itens do pedido)
- Função de cálculo de frete (baseada em CEP/endereço)
- Endpoint POST `/api/orders/checkout` - valida carrinho, calcula frete, cria pedido
- Validações: carrinho não vazio, endereço válido
- Esvaziar carrinho após sucesso

**Front-end:**
- Página de checkout com formulário de endereço
- Exibição de resumo (itens, subtotal, frete, total)
- Integração com API de frete (simplificado ou mock)
- Confirmação após sucesso

---

### 1.3 Histórico de Pedidos
**Objetivo:** Usuário visualiza seu histórico filtrado por período.

**Back-end:**
- Endpoint GET `/api/orders` - lista pedidos do usuário autenticado
- Query params: `startDate` e `endDate` (opcionais)
- Ordenação: mais recente primeiro
- Retorna: resumo de cada pedido (ID, data, total, status)

**Front-end:**
- Página de histórico com filtro de data
- Listagem de pedidos com cards resumidos
- Link para detalhes do pedido
- Exibição de status do pedido

---

## FASE 2: Sistema de Gerenciamento de Tarefas (Boards)

### 2.1 Autenticação e Sessão
**Objetivo:** Usuário cadastro, login e permanece autenticado entre sessões.

**Back-end:**
- Entidade `User` com email, senha (hash), nome
- JWT tokens (access + refresh)
- Endpoint POST `/api/auth/register` - cadastro
- Endpoint POST `/api/auth/login` - login retornando tokens
- Middleware para verificar JWT em rotas protegidas
- Refresh token endpoint

**Front-end:**
- Página de registro
- Página de login
- Armazenamento seguro de tokens (localStorage/sessionStorage)
- Context/Provider para estado de autenticação
- Redirecionamento para login se não autenticado
- Logout funcional

---

### 2.2 Boards (Quadros)
**Objetivo:** Usuário cria, visualiza, edita e exclui quadros pessoais.

**Back-end:**
- Entidade `Board` (owner User, title, description)
- Endpoint POST `/api/boards` - criar novo board
- Endpoint GET `/api/boards` - listar boards do usuário
- Endpoint GET `/api/boards/:id` - detalhes completos (com listas e cards)
- Endpoint PATCH `/api/boards/:id` - editar title/description
- Endpoint DELETE `/api/boards/:id` - excluir board

**Front-end:**
- Dashboard com lista de boards
- Card por board com thumbnail/resumo
- Modal/página para criar novo board
- Página do board (visualização principal)
- Opções de editar/excluir board

---

### 2.3 Listas (Lists)
**Objetivo:** Dentro de cada board, usuário gerencia listas.

**Back-end:**
- Entidade `List` (board, title, position)
- Endpoint POST `/api/lists` - criar lista no board
- Endpoint GET `/api/lists/:boardId` - listar listas do board
- Endpoint PATCH `/api/lists/:id` - renomear lista
- Endpoint DELETE `/api/lists/:id` - excluir lista (com cascata para cards)
- Endpoint PATCH `/api/lists/:id/reorder` - reordenar posição

**Front-end:**
- Colunas no board para cada lista
- Campo de entrada para criar nova lista
- Botão de editar/deletar lista
- Drag-and-drop para reordenar listas (opcional nesta fase)

---

### 2.4 Cards (Cartões)
**Objetivo:** Criar, editar, mover e excluir cards dentro de listas.

**Back-end:**
- Entidade `Card` (list, title, description, position)
- Endpoint POST `/api/cards` - criar card em lista
- Endpoint GET `/api/cards/:listId` - listar cards da lista
- Endpoint PATCH `/api/cards/:id` - editar card
- Endpoint DELETE `/api/cards/:id` - excluir card
- Endpoint PATCH `/api/cards/:id/move` - mover entre listas
- Endpoint PATCH `/api/cards/:id/reorder` - reordenar na lista

**Front-end:**
- Cards dentro de colunas (listas)
- Clique para abrir modal/drawer de detalhes
- Campo de entrada rápida para criar card
- Drag-and-drop para mover cards (opcional)
- Botões de editar/deletar card

---

### 2.5 Checklists
**Objetivo:** Cards podem ter checklists com progress tracking.

**Back-end:**
- Entidade `Checklist` (card, title)
- Entidade `ChecklistItem` (checklist, title, completed)
- Endpoint POST `/api/checklists` - criar checklist no card
- Endpoint POST `/api/checklist-items` - adicionar item
- Endpoint PATCH `/api/checklist-items/:id` - marcar como completo
- Endpoint DELETE `/api/checklist-items/:id` - remover item
- Campo calculado: progress %

**Front-end:**
- Seção de checklists no modal do card
- Caixa de seleção para cada item
- Barra de progresso visual
- Entrada para novos itens

---

### 2.6 Membros e Papéis
**Objetivo:** Admin do board convida membros e atribui papéis/cards.

**Back-end:**
- Entidade `BoardMember` (board, user, role: admin/editor/viewer)
- Entidade `CardAssignee` (card, user)
- Endpoint POST `/api/boards/:id/members` - convidar membro
- Endpoint PATCH `/api/board-members/:id` - mudar papel
- Endpoint DELETE `/api/board-members/:id` - remover membro
- Endpoint POST `/api/cards/:id/assignees` - atribuir card a usuário
- Endpoint DELETE `/api/cards/:id/assignees/:userId` - remover atribuição

**Front-end:**
- Seção de membros na página do board
- Modal para convidar novo membro (email)
- Dropdown de papéis
- Avatar/nome do assignee no card
- Clique para atribuir/remover do card

---

### 2.7 Etiquetas (Labels)
**Objetivo:** Criar etiquetas coloridas e filtrar cards.

**Back-end:**
- Entidade `Label` (board, title, color)
- Entidade `CardLabel` (card, label)
- Endpoint POST `/api/labels` - criar label
- Endpoint POST `/api/cards/:id/labels` - adicionar label ao card
- Endpoint DELETE `/api/cards/:id/labels/:labelId` - remover label
- Endpoint GET `/api/boards/:id/cards?labels=xxx` - filtrar por label

**Front-end:**
- Gerenciador de labels na página do board
- Seleção de cores
- Tags coloridas nos cards
- Clique na tag para filtrar board
- Filtro ativo destacado

---

### 2.8 Comentários
**Objetivo:** Usuários comentam nos cards e veem histórico.

**Back-end:**
- Entidade `Comment` (card, user, content, createdAt)
- Endpoint POST `/api/cards/:id/comments` - adicionar comentário
- Endpoint GET `/api/cards/:id/comments` - listar comentários (ordenado por data)
- Endpoint DELETE `/api/comments/:id` - deletar (se autor)
- Metadata de quem/quando editou

**Front-end:**
- Seção de comentários no modal do card
- Timeline de comentários
- Campo de entrada para novo comentário
- Exibição de autor e timestamp

---

### 2.9 Prazos e Atrasos
**Objetivo:** Cards com prazos e identificação visual de atrasos.

**Back-end:**
- Campo `dueDate` em Card (nullable)
- Endpoint PATCH `/api/cards/:id` - atualizar dueDate
- Query param para filtrar: `?overdue=true`

**Front-end:**
- Campo de data no modal do card
- Data exibida no card (se houver)
- Cards atrasados destacados (cor vermelha/badge)
- Filtro/badge "Atrasados" no board
- Indicador visual (ícone de relógio/cabeça de caveira)

---

## Tabela de Dependências e Ordem de Implementação

| Fase | Feature | Depende de |
|------|---------|-----------|
| 1.1 | Carrinho | User Entity, Product Entity |
| 1.2 | Checkout | Carrinho, Order Entity |
| 1.3 | Histórico | Checkout, Order Entity |
| 2.1 | Auth | User Entity |
| 2.2 | Boards | Auth |
| 2.3 | Lists | Boards |
| 2.4 | Cards | Lists |
| 2.5 | Checklists | Cards |
| 2.6 | Membros | Boards, Cards |
| 2.7 | Etiquetas | Boards, Cards |
| 2.8 | Comentários | Cards |
| 2.9 | Prazos | Cards |

---

## Estrutura de Banco de Dados (Resumo)

### Tabelas E-Commerce
- `users` (id, email, senha, nome)
- `products` (id, nome, preço, descrição)
- `carts` (id, userId)
- `cart_items` (id, cartId, productId, quantidade)
- `orders` (id, userId, total, frete, dataEntrega)
- `order_items` (id, orderId, productId, quantidade, preço)

### Tabelas Boards
- `boards` (id, ownerId, title, description, createdAt)
- `board_members` (id, boardId, userId, role)
- `lists` (id, boardId, title, position)
- `cards` (id, listId, title, description, position, dueDate)
- `checklists` (id, cardId, title)
- `checklist_items` (id, checklistId, title, completed)
- `labels` (id, boardId, title, color)
- `card_labels` (id, cardId, labelId)
- `comments` (id, cardId, userId, content, createdAt)
- `card_assignees` (id, cardId, userId)

---

## Stack Confirmado
- **Back-end:** Node.js + Express + TypeORM
- **Front-end:** React + TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
