# Plano Técnico — Gerenciador de Quadros de Tarefas

Este plano responde a **como construir** o que está definido em [`docs/spec.md`](./spec.md). A especificação continua sendo a fonte de verdade do comportamento; onde este plano parecer divergir dela, vale a especificação. Referências como `RN-B4`, `CA-L6` e `B8` apontam para itens da especificação.

Palavras como **DEVE**, **NÃO DEVE** e **PODE** indicam, respectivamente, restrição obrigatória, proibição e liberdade da implementação. Cada restrição obrigatória tem um identificador `R-xx` (seção 8) para referência nas fases seguintes.

---

## 1. Tecnologias e frameworks

A base do repositório já está criada (`back-end/` e `front-end/`). O plano parte dela e só acrescenta o que falta.

### 1.1 Back-end

| Preocupação | Escolha | Motivo |
|---|---|---|
| Runtime / linguagem | Node 24, TypeScript 5 com `strict` (já configurado) | Já adotado no projeto; tipagem ponta a ponta. |
| HTTP | Express 5 (já instalado) | Em Express 5, promises rejeitadas em handlers chegam ao tratador de erros sem *wrapper*. |
| Banco | PostgreSQL via `docker-compose.yml` na raiz de `back-end/` | Exigido pelo contexto do projeto. Suporta transações, bloqueio de linha, FKs com cascata e tipo `date`. |
| ORM | TypeORM 1.1.1 (já instalado) | Exigido pelo contexto do projeto. |
| Validação de entrada | `zod` | Esquema declarativo, mensagens por campo, remoção de campos desconhecidos. |
| Cookies | `cookie-parser` | Leitura do cookie de sessão. |
| Cabeçalhos de segurança | `helmet` | Cabeçalhos HTTP seguros por padrão. |
| Limite de taxa | `express-rate-limit` | Proteção de força bruta nas rotas de autenticação. |
| Hash de senha | `node:crypto` (`scrypt`) | Sem dependência nativa nova, sem limite de 72 bytes do bcrypt, resistente a GPU. |

**Dependências novas a instalar** (`npm install` em `back-end/`): `zod`, `cookie-parser`, `helmet`, `express-rate-limit`, e `@types/cookie-parser` como dependência de desenvolvimento.

### 1.2 Front-end

| Preocupação | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16.3.4, App Router, React 19 (já instalados) | Já adotado. |
| Estilo | Tailwind CSS 4 (já instalado) | Já adotado. |
| Cliente HTTP | `axios` (já instalado) | Interceptadores centralizam o tratamento de 401 e de erros. |
| Estado de servidor | `@tanstack/react-query` | Cache por chave, invalidação e atualização otimista com *rollback*. |
| Arrastar e soltar | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Suporte a teclado e acessibilidade; reordenação de listas e cards. |
| Datas | API nativa (`Intl`), sem biblioteca | O prazo é uma data sem hora; evita problemas de fuso. |

**Dependências novas a instalar** (`npm install` em `front-end/`): `@tanstack/react-query`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

### 1.3 Pontos de atenção do Next 16

O `front-end/AGENTS.md` avisa que esta versão do Next tem mudanças incompatíveis. Antes de escrever qualquer código do front, a implementação **DEVE** consultar `front-end/node_modules/next/dist/docs/`. Já confirmado:

- A convenção `middleware` foi **renomeada para `proxy`** (arquivo `src/proxy.ts`, função exportada `proxy`).
- O `proxy` roda antes da renderização e **não deve depender de módulos ou estado compartilhados**; serve só para redirecionamentos baratos.

### 1.4 Referência visual

O protótipo `protoripo.pen` (raiz do repositório) é a inspiração de UI/UX e **DEVE** ser consultado, somente pelas ferramentas MCP do Pencil, durante a implementação do front. O plano não fixa layout nem identidade visual.

---

## 2. Arquitetura

### 2.1 Visão geral

```
Navegador ──(mesma origem, /api/*)──► Next.js (front-end) ──rewrite──► Express (back-end) ──► PostgreSQL
```

- O navegador **só** fala com a origem do Next. O Next redireciona (`rewrites`) toda chamada `/api/:path*` para a API do back-end. Assim:
  - o cookie de sessão é de primeira parte, sem CORS nem cookies de terceiros;
  - o `proxy.ts` do Next enxerga o cookie de sessão para proteger rotas;
  - a porta do back-end nunca é exposta ao código do navegador.
- A API é **sem estado**: toda a sessão vive no banco, então várias instâncias podem rodar atrás de um balanceador.
- O back-end é a **única autoridade** sobre permissões, validação e regras de negócio. O front só reflete (esconde controles) e nunca é a barreira de segurança (RN-B2).

### 2.2 Camadas do back-end

```
Rota (HTTP) ─► Validação (zod) ─► Serviço (regras + transação) ─► Entidades TypeORM ─► PostgreSQL
                    ▲                       ▲
          Middleware de sessão     Serviço de acesso (papel por quadro)
```

| Camada | Responsabilidade | NÃO pode |
|---|---|---|
| **Rotas** (`modules/*/…routes`) | Mapear verbo + caminho, aplicar validação, chamar serviço, serializar DTO e status. | Conter regra de negócio ou consultar o banco. |
| **Validação** (`modules/*/…schemas`) | Esquemas `zod` com os limites da seção 5 da especificação. | Acessar o banco. |
| **Serviços** (`modules/*/…service`) | Regras de negócio, autorização por papel, transações, bloqueios e ordenação. Lançam erros de domínio tipados. | Conhecer `req`/`res` do Express. |
| **Serviço de acesso** (`shared/access`) | Dado um recurso (lista, card, etiqueta…), resolver o quadro e o papel do usuário; lançar 404 ou 403. | Ser contornado: toda rota autenticada de recurso passa por ele. |
| **Entidades** (`src/entities/`) | Mapeamento TypeORM, índices, FKs e cascatas. | Conter lógica de negócio. |
| **Erros / middlewares** (`shared/`) | Erros de domínio, tratador de erros central, sessão, limite de taxa, checagem de origem. | — |

### 2.3 Módulos do back-end

`auth`, `boards`, `members`, `lists`, `cards`, `checklists`, `labels`, `comments`. Cada módulo contém suas rotas, esquemas e serviço. Um módulo **NÃO DEVE** acessar diretamente tabelas de outro; usa o serviço do outro módulo ou o serviço de acesso.

Estrutura de diretórios do back-end (relativa a `back-end/src/`):

```
main.ts · app.ts · database.ts · config/env.ts
entities/            (plano: arquivos planos, pois o glob atual é entities/*.{ts,js})
modules/{auth,boards,members,lists,cards,checklists,labels,comments}/
shared/{errors, http, session, access, ordering, palette, limits}
```

`app.ts` monta o Express (middlewares e rotas) sem abrir porta nem conectar ao banco; `main.ts` inicializa o `DataSource` e escuta.

### 2.4 Front-end

```
src/
  proxy.ts                      guarda otimista de rotas (cookie presente?)
  app/
    (public)/login, register
    (app)/boards                lista de quadros
    (app)/boards/[boardId]      quadro; o card aberto é o parâmetro de busca ?card=<id>
  components/{ui,board,card,members,labels}
  lib/{api, queries, types, progress, dates, palette}
```

Fronteiras:

- **Todas as páginas autenticadas são Client Components** que buscam dados no navegador via `axios` + React Query. Um único caminho de dados mantém o cookie e o tratamento de 401 em um lugar só. Server Components **NÃO DEVEM** chamar a API.
- `lib/api` é o **único** ponto que conhece URLs e instância do `axios`. Componentes não importam `axios`.
- `lib/queries` define chaves e *hooks* de consulta/mutação. Chaves: `['me']`, `['boards']`, `['board', id]`, `['card', id]`, `['comments', cardId]`.
- `lib/progress` e `lib/dates` concentram as regras de progresso (RN-D1) e de atraso (RN-D3); nenhuma outra parte reimplementa essas contas.
- O filtro por etiqueta (RN-F2/F3) é **estado local** do quadro, aplicado em memória sobre os dados já carregados. Não é enviado ao servidor nem persistido.
- Cards atrasados, progresso e contagem de atrasados no quadro são **calculados no cliente** (a especificação ancora "dia atual" no fuso de quem visualiza). O servidor não calcula `isOverdue`.

### 2.5 Guarda de rotas e sessão no front

- `proxy.ts` faz verificação **apenas da presença** do cookie de sessão: sem cookie em rota protegida → `/login?next=<destino>`; com cookie em `/login` ou `/register` → `/boards`. A validade real é decidida pela API (C5, CA-C9).
- Qualquer resposta `401` da API (sessão expirada, B14) aciona, no interceptador do `axios`, limpeza do cache do React Query e redirecionamento para `/login?next=<rota atual>`. Dados não gravados **NÃO** são reenviados automaticamente.
- `404` ao carregar um quadro mostra a tela "quadro não encontrado" (CA-Q3, B12, B36).

---

## 3. Modelo de dados

PostgreSQL, gerenciado por entidades TypeORM. Convenções:

- Tabelas no plural e `snake_case`; colunas `snake_case` (nome explícito nos decoradores).
- Chaves primárias `uuid` geradas pelo banco (`gen_random_uuid()`).
- Timestamps `timestamptz`, em UTC.
- Toda exclusão em cascata é feita por **FK com `ON DELETE CASCADE`**, não por laços na aplicação (RN-X1…X5).
- Propriedades das entidades usam asserção de atribuição definitiva por causa do `strict`.

### 3.1 Diagrama lógico

```
users ─< sessions
users ─< board_members >─ boards
boards ─< lists ─< cards
boards ─< labels
boards ─< cards          (cards.board_id, denormalizado)
cards >─< labels         (card_labels)
cards >─< users          (card_assignees)
cards ─< checklists ─< checklist_items
cards ─< comments >─ users (autor)
```

### 3.2 Tabelas

**`users`**

| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| name | varchar(100) | NOT NULL |
| email | varchar(254) | NOT NULL, **UNIQUE**; gravado já normalizado (sem espaços nas pontas, minúsculas) — RN-A1 |
| password_hash | varchar(255) | NOT NULL; formato autodescritivo `scrypt$N$r$p$salt$hash` |
| created_at | timestamptz | NOT NULL, default `now()` |

**`sessions`**

| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users` ON DELETE CASCADE, NOT NULL, índice |
| token_hash | char(64) | NOT NULL, **UNIQUE** (SHA-256 do token; o token em si nunca é gravado) |
| created_at | timestamptz | NOT NULL |
| last_used_at | timestamptz | NOT NULL |
| expires_at | timestamptz | NOT NULL, índice |

**`boards`**: `id`, `name varchar(100) NN`, `description varchar(500) NULL`, `created_at`, `updated_at`.

**`board_members`**

| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| board_id | uuid | FK `boards` CASCADE, NN |
| user_id | uuid | FK `users` CASCADE, NN, índice |
| role | enum(`admin`,`collaborator`,`observer`) | NN |
| created_at | timestamptz | NN |
| | | **UNIQUE (board_id, user_id)** — RN-B5 |

**`lists`**: `id`, `board_id` FK `boards` CASCADE NN, `name varchar(100) NN`, `position int NN`, `created_at`. Índice `(board_id, position)`.

**`cards`**

| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| list_id | uuid | FK `lists` CASCADE, NN |
| board_id | uuid | FK `boards` CASCADE, NN. Redundante com `lists.board_id` de propósito: permite autorizar e carregar o quadro sem *join*. **Imutável**; definido na criação (RN-S4). |
| title | varchar(200) | NN |
| description | varchar(5000) | NULL |
| position | int | NN, posição na lista |
| due_date | date | NULL (data sem hora, RN-D3) |
| completed | boolean | NN, default `false` |
| created_at / updated_at | timestamptz | NN |
| | | Índices `(list_id, position)` e `(board_id)` |

**`labels`**: `id`, `board_id` FK CASCADE NN, `name varchar(30) NN`, `name_key varchar(30) NN` (nome em minúsculas, usado para unicidade sem distinção de caixa), `color varchar(16) NN` (chave da paleta). **UNIQUE (board_id, name_key)** — RN-S5.

**`card_labels`**: PK composta `(card_id, label_id)`, ambos FK com CASCADE. A regra "etiqueta e card do mesmo quadro" (RN-F1) é garantida no serviço.

**`card_assignees`**: PK composta `(card_id, user_id)`; FK `cards` CASCADE e `users` CASCADE. A regra "só membros" (RN-R1) e a remoção ao tirar um membro (RN-X6) são garantidas no serviço, na mesma transação.

**`checklists`**: `id`, `card_id` FK CASCADE NN, `title varchar(100) NN`, `created_at`. Índice `card_id`.

**`checklist_items`**: `id`, `checklist_id` FK CASCADE NN, `text varchar(200) NN`, `checked boolean NN default false`, `created_at`. Índice `checklist_id`. Checklists e itens são exibidos por `created_at` e depois `id` (CA-CK1); a especificação não pede reordená-los, então **não têm coluna de posição**.

**`comments`**: `id`, `card_id` FK CASCADE NN, `author_id` FK `users` NN (sem cascata: não há exclusão de conta), `body varchar(2000) NN`, `created_at NN`. Índice `(card_id, created_at)`. Nenhuma operação de atualização ou exclusão individual existe (RN-F4).

### 3.3 Paleta de cores de etiqueta

Conjunto fixo de 10 chaves, validado no servidor: `red, orange, yellow, green, teal, blue, indigo, purple, pink, gray`. O banco guarda a **chave**; o mapeamento para cor visual é do front (`lib/palette`).

### 3.4 Ordenação (listas e cards)

- `position` é **inteiro denso e 0-based** dentro do contêiner (quadro para listas; lista para cards). Não há valores repetidos nem buracos fora de uma transação.
- Criar → `position = quantidade atual`. Excluir → renumera os irmãos restantes para fechar o buraco. Mover → remove da origem, insere no destino e renumera as duas listas afetadas.
- A posição de destino é limitada ao intervalo válido (`0…n`); valores fora disso são ajustados, nunca rejeitados (B19). Mover para a posição atual é *no-op* (B18).
- **NÃO se usa** restrição UNIQUE em `position`, pois a renumeração em lote violaria a restrição transitoriamente.

### 3.5 Esquema do banco e migrações

O `database.ts` atual usa `synchronize: true`. Para este projeto isso é aceito **somente fora de produção**: `synchronize` **DEVE** ser `false` quando `NODE_ENV=production`, caso em que a evolução de esquema passa a exigir migrações. Introduzir migrações está fora do escopo desta entrega.

---

## 4. Interfaces e contratos

### 4.1 Convenções gerais

- REST sobre JSON, prefixo `/api`. O Next encaminha `/api/:path*` para `${API_URL}/api/:path*`.
- Requisições e respostas `application/json; charset=utf-8`. Corpo de requisição ausente quando não necessário.
- Identificadores são UUID. Um id **malformado** é tratado como `404 NOT_FOUND`, nunca como `500`.
- Datas-e-horas em ISO 8601 UTC. `dueDate` em `YYYY-MM-DD`. Textos sempre devolvidos já sem espaços nas pontas.
- Campos desconhecidos no corpo são descartados. Campos opcionais em `PATCH` ausentes significam "não alterar"; `null` explícito significa "limpar" (apenas onde permitido: `description`, `dueDate`).
- Respostas autenticadas levam `Cache-Control: no-store`.
- Mensagens de erro voltadas ao usuário em português do Brasil.
- Autenticação por cookie `sid` (ver seção 5.2); nenhum token vai em corpo, URL ou `localStorage`.

### 4.2 Formato de erro

```
{ "error": { "code": "<CODIGO>", "message": "<texto pt-BR>", "fields": { "<campo>": "<mensagem>" }, "details": { … } } }
```

`fields` só aparece em `VALIDATION_ERROR`; `details` só onde indicado.

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Campo vazio, acima do limite, formato inválido, cor fora da paleta, data inválida (B1–B6). |
| 401 | `UNAUTHENTICATED` | Sem sessão válida ou sessão expirada. |
| 401 | `INVALID_CREDENTIALS` | Login falhou; **mesma** resposta para e-mail inexistente e senha errada (RN-A5). |
| 403 | `FORBIDDEN` | Membro sem papel suficiente para a ação (B13). |
| 404 | `NOT_FOUND` | Recurso inexistente, id malformado **ou** usuário que não é membro do quadro (RN-B1, B12). |
| 409 | `EMAIL_IN_USE` | Cadastro com e-mail já existente (inclui disputa simultânea, B11). |
| 409 | `ALREADY_MEMBER` | Convite para quem já é membro, inclusive o próprio convidante (B15). |
| 409 | `LABEL_NAME_IN_USE` | Nome de etiqueta repetido no quadro (CA-E2). |
| 409 | `LAST_ADMIN` | Rebaixar/remover o último Administrador (RN-B4). |
| 409 | `LIST_NOT_EMPTY` | Exclusão de lista com cards sem confirmação correta; `details: { cardCount }`. |
| 422 | `USER_NOT_FOUND` | Convite para e-mail sem conta (CA-M2). |
| 422 | `USER_NOT_MEMBER` | Atribuir a um card alguém que não é membro (CA-M10). |
| 422 | `INVALID_TARGET` | Mover card para lista de outro quadro (CA-K7). |
| 429 | `RATE_LIMITED` | Limite de taxa excedido. |
| 500 | `INTERNAL_ERROR` | Falha inesperada; sem *stack trace* nem detalhes internos na resposta. |

Regra de decisão entre 404 e 403: o serviço de acesso primeiro resolve o quadro do recurso; **sem vínculo de membro → 404**; com vínculo mas papel insuficiente → 403. A resposta 404 é idêntica para "não existe" e "não é seu".

### 4.3 Matriz de autorização por endpoint

`A` = Administrador, `C` = Colaborador, `O` = Observador. A coluna indica o **papel mínimo** exigido; "membro" quer dizer qualquer papel.

### 4.4 Endpoints

**Autenticação**

| Método e caminho | Corpo | Sucesso | Observações |
|---|---|---|---|
| `POST /api/auth/register` | `{ name, email, password }` | `201 { user }` + cookie | Já autentica (C1). `EMAIL_IN_USE`, `VALIDATION_ERROR`. |
| `POST /api/auth/login` | `{ email, password }` | `200 { user }` + cookie | `INVALID_CREDENTIALS`. |
| `POST /api/auth/logout` | — | `204`, cookie removido | Remove a sessão no banco. Idempotente. |
| `GET /api/auth/me` | — | `200 { user }` | `401` sem sessão. |

**Quadros** (papel mínimo)

| Método e caminho | Corpo | Sucesso | Papel |
|---|---|---|---|
| `GET /api/boards` | — | `200 { items: BoardSummary[] }` | autenticado |
| `POST /api/boards` | `{ name, description? }` | `201 BoardSummary` | autenticado (vira `A`) |
| `GET /api/boards/:boardId` | — | `200 BoardDetail` | membro |
| `PATCH /api/boards/:boardId` | `{ name?, description? }` | `200 BoardSummary` | A |
| `DELETE /api/boards/:boardId` | — | `204` | A |

**Membros**

| Método e caminho | Corpo | Sucesso | Papel |
|---|---|---|---|
| `GET /api/boards/:boardId/members` | — | `200 { items: Member[] }` | membro |
| `POST /api/boards/:boardId/members` | `{ email, role }` | `201 Member` | A |
| `PATCH /api/boards/:boardId/members/:userId` | `{ role }` | `200 Member` | A |
| `DELETE /api/boards/:boardId/members/:userId` | — | `204` | A |

**Listas**

| Método e caminho | Corpo | Sucesso | Papel |
|---|---|---|---|
| `POST /api/boards/:boardId/lists` | `{ name }` | `201 List` | C |
| `PATCH /api/lists/:listId` | `{ name }` | `200 List` | C |
| `POST /api/lists/:listId/move` | `{ position }` | `200 { orderedListIds }` | C |
| `DELETE /api/lists/:listId?confirmCards=<n>` | — | `204` | C |

Exclusão de lista (RF05, CA-L5…L7, B24): o parâmetro `confirmCards` representa **a quantidade de cards que o usuário confirmou excluir** (omitido = 0). Dentro da transação, o servidor conta os cards da lista: se a contagem real for diferente de `confirmCards`, responde `409 LIST_NOT_EMPTY` com `details.cardCount` atual e **não exclui nada**. Assim a confirmação sempre refere-se à quantidade correta, mesmo se outro usuário criou ou removeu cards enquanto o diálogo estava aberto. Lista vazia exige `confirmCards` omitido ou `0`.

**Cards**

| Método e caminho | Corpo | Sucesso | Papel |
|---|---|---|---|
| `POST /api/lists/:listId/cards` | `{ title }` | `201 CardSummary` | C |
| `GET /api/cards/:cardId` | — | `200 CardDetail` | membro |
| `PATCH /api/cards/:cardId` | `{ title?, description?, dueDate?, completed? }` | `200 CardDetail` | C |
| `POST /api/cards/:cardId/move` | `{ listId, position }` | `200 { moved: [{ listId, orderedCardIds }] }` | C |
| `DELETE /api/cards/:cardId` | — | `204` | C |

`move` devolve a ordem final das listas afetadas (origem e destino, ou só uma se o movimento for interno) para o cliente reconciliar. `listId` de outro quadro → `422 INVALID_TARGET`; lista inexistente → `404`.

**Checklists** (todas exigem `C`)

| Método e caminho | Corpo | Sucesso |
|---|---|---|
| `POST /api/cards/:cardId/checklists` | `{ title }` | `201 Checklist` |
| `PATCH /api/checklists/:checklistId` | `{ title }` | `200 Checklist` |
| `DELETE /api/checklists/:checklistId` | — | `204` |
| `POST /api/checklists/:checklistId/items` | `{ text }` | `201 { item, progress }` |
| `PATCH /api/checklist-items/:itemId` | `{ text?, checked? }` | `200 { item, progress }` |
| `DELETE /api/checklist-items/:itemId` | — | `200 { progress }` |

`progress` é `{ checked, total }` do **card** inteiro (todas as checklists) após a operação. Exclusão de checklist devolve `200 { progress }` em vez de `204`, pelo mesmo motivo.

**Etiquetas** (escrita exige `C`)

| Método e caminho | Corpo | Sucesso |
|---|---|---|
| `POST /api/boards/:boardId/labels` | `{ name, color }` | `201 Label` |
| `PATCH /api/labels/:labelId` | `{ name?, color? }` | `200 Label` |
| `DELETE /api/labels/:labelId` | — | `204` |
| `PUT /api/cards/:cardId/labels/:labelId` | — | `204` (idempotente) |
| `DELETE /api/cards/:cardId/labels/:labelId` | — | `204` (idempotente) |

Não existe endpoint de filtro: ele é local ao cliente (RN-F3).

**Responsáveis** (escrita exige `C`)

| Método e caminho | Sucesso |
|---|---|
| `PUT /api/cards/:cardId/assignees/:userId` | `204` (idempotente; `422 USER_NOT_MEMBER`) |
| `DELETE /api/cards/:cardId/assignees/:userId` | `204` (idempotente) |

**Comentários**

| Método e caminho | Corpo | Sucesso | Papel |
|---|---|---|---|
| `GET /api/cards/:cardId/comments` | — | `200 { items: Comment[] }` (mais antigo primeiro) | membro |
| `POST /api/cards/:cardId/comments` | `{ body }` | `201 Comment` | C |

Não existem rotas de edição ou exclusão de comentário (CA-CM6).

**Operação**

| Método e caminho | Sucesso |
|---|---|
| `GET /api/health` | `200 { status: "ok" }` (verifica conexão com o banco; sem autenticação) |

### 4.5 DTOs (contratos de resposta)

Campos listados são **exatos**; nenhum DTO expõe `password_hash`, `token_hash` ou colunas internas.

| DTO | Campos |
|---|---|
| `User` | `id, name, email` |
| `BoardSummary` | `id, name, description, role, memberCount, createdAt` — `role` é o papel de quem pede |
| `Member` | `userId, name, email, role` |
| `Label` | `id, name, color` |
| `CardSummary` | `id, listId, title, position, dueDate, completed, labelIds[], assigneeIds[], checklistChecked, checklistTotal` |
| `List` | `id, name, position, cards: CardSummary[]` (cards ordenados) |
| `BoardDetail` | `id, name, description, role, members: Member[], labels: Label[], lists: List[]` (listas ordenadas) |
| `Checklist` | `id, title, items: [{ id, text, checked }]` |
| `CardDetail` | `CardSummary` + `boardId, description, createdAt, updatedAt, checklists: Checklist[]` |
| `Comment` | `id, cardId, body, createdAt, author: { id, name }` |

`BoardDetail` carrega o quadro inteiro numa chamada, de modo que filtro, progresso, atraso e contagem de atrasados funcionam sem novas requisições. Respostas de coleção usam envelope `{ items: [...] }` para permitir paginação futura sem quebrar contrato.

### 4.6 Semântica transversal

- **Idempotência:** `PUT`/`DELETE` de vínculos (etiqueta, responsável) repetidos retornam sucesso sem duplicar (CA-M11, CA-E5).
- **Concorrência:** última escrita vence em edição de campo (B9); estruturas ordenadas são serializadas por quadro (seção 6.3).
- **Recurso removido no meio da ação:** `404 NOT_FOUND`, sem criar dados órfãos (B7, B29); o front recarrega a visão.
- **Papel avaliado em toda requisição**, lido do banco; nunca guardado na sessão ou no cliente (B10).

---

## 5. Segurança

### 5.1 Senhas

- Hash com `scrypt` (`node:crypto`), sal aleatório de 16 bytes por usuário, parâmetros `N=2^15, r=8, p=1`, saída de 64 bytes, comparação em tempo constante (`timingSafeEqual`). Os parâmetros ficam gravados no próprio `password_hash`, permitindo reforçá-los depois.
- Tamanho da senha: mínimo 8 (RN-A2); **máximo 128 caracteres**, limite acrescentado por este plano para limitar o custo de hash. O front espelha esse limite no campo.
- Senhas nunca são registradas em log nem devolvidas (RN-A3).

### 5.2 Sessão

- Token opaco de 32 bytes aleatórios (`crypto.randomBytes`), em base64url. No banco guarda-se **apenas o SHA-256** do token.
- Cookie `sid`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` quando `NODE_ENV=production`, `Max-Age` de 30 dias.
- Expiração **deslizante** de 30 dias de inatividade (RN-A4): ao usar a sessão, `last_used_at`/`expires_at`/`Max-Age` são renovados, com gravação no banco no máximo **uma vez por hora** por sessão para não gerar escrita a cada requisição.
- Logout apaga a linha em `sessions` (efeito imediato e verdadeiro, CA-C8). Sessões expiradas do usuário são limpas no login.
- Motivo de não usar JWT: logout e expiração devem ter efeito imediato e a permissão é lida a cada requisição; sessão em banco satisfaz isso sem lista de revogação.

### 5.3 Proteções de requisição

- **CSRF:** `SameSite=Lax` + chamadas de mesma origem (via rewrite) + rejeição, no back-end, de requisições com método não seguro cujo `Origin` (quando presente) não seja `WEB_ORIGIN` + corpo aceito somente como `application/json`.
- **CORS:** o `cors()` aberto atual **DEVE** ser substituído por *allowlist* restrita a `WEB_ORIGIN` com `credentials: true`.
- **Limite de taxa:** rotas `/api/auth/*`: no máximo 20 requisições por 15 minutos por IP; demais rotas: 300 por minuto por IP. Excedido → `429 RATE_LIMITED`. Com proxy reverso, `trust proxy` deve ser configurado corretamente.
- **Cabeçalhos:** `helmet` ativo.
- **Entrada:** toda entrada externa (corpo, parâmetros de rota e de query) passa por `zod` antes de chegar ao serviço.
- **SQL:** somente consultas parametrizadas do TypeORM; é proibido montar SQL por concatenação de strings.
- **XSS:** o front só renderiza texto do usuário por React (escapado); `dangerouslySetInnerHTML` é proibido (B5).
- **Enumeração de contas:** o login não revela qual credencial falhou. Cadastro e convite revelam existência de e-mail por exigência da especificação (CA-C2, CA-M2); a mitigação é exigir autenticação no convite e aplicar o limite de taxa.
- **Exposição de dados entre membros:** membros veem nome e e-mail dos demais membros do mesmo quadro (necessário para convite e atribuição); nada além disso é compartilhado.

### 5.4 Segredos e configuração

- Segredos só em variáveis de ambiente. Nenhuma credencial no código.
- Variáveis do back-end: `PORT`, `NODE_ENV`, `POSTGRES_HOST/PORT/USER/PASSWORD/DB` (já existem) e **`WEB_ORIGIN`** (nova; origem do front para CORS/checagem de origem).
- Variável do front: `API_URL` (destino do rewrite; padrão `http://localhost:3333` em desenvolvimento).
- O módulo `config/env` valida as variáveis na partida e **derruba o processo** com mensagem clara se faltar alguma obrigatória.
- Observação: o arquivo `back-end/.env` está versionado no repositório; esta entrega não adiciona novos segredos a ele.

### 5.5 Logs

Um registro por requisição com método, caminho (sem query string), status e duração, mais um identificador de requisição também devolvido em `X-Request-Id`. Nunca registrar corpo de requisição, cookies, senhas ou tokens. Erros 5xx registram o *stack* no servidor, nunca na resposta.

---

## 6. Desempenho e escalabilidade

### 6.1 Metas

Medidas com banco local e um quadro de referência com 10 listas e 500 cards:

| Operação | Meta (p95) |
|---|---|
| `GET /api/boards/:id` | ≤ 300 ms |
| Mutação simples (criar/editar/excluir) | ≤ 200 ms |
| Mover/reordenar | ≤ 250 ms |
| `login` / `register` | ≤ 600 ms (custo do hash é intencional) |

No front, mover cards e listas é **otimista**: a interface reage imediatamente e reverte com mensagem se a API falhar.

### 6.2 Restrições de desempenho

- Carregar o quadro **DEVE** executar um número **constante** de consultas (no máximo 8), independente do número de cards: vínculo+quadro, membros, etiquetas, listas, cards com contagem de checklist agregada, vínculos card–etiqueta, vínculos card–responsável. **N+1 é proibido.**
- Contagens de progresso (`checklistChecked/Total`) são agregadas no banco, não calculadas carregando todos os itens.
- Os índices da seção 3 são obrigatórios; consultas por `board_id`, `list_id`, `card_id` e `user_id` **DEVEM** usar índice.
- Comentários e itens de checklist são carregados sob demanda ao abrir o card (`GET /cards/:id`, `GET /cards/:id/comments`), não no `BoardDetail`.
- O front **DEVE** evitar re-renderizar o quadro inteiro a cada movimento de arrastar: componentes de lista e card memoizados com dados estáveis.
- Limitação conhecida e aceita: a lista de comentários de um card é devolvida inteira (a especificação não limita a quantidade). O envelope `{ items }` e o índice `(card_id, created_at)` permitem adicionar paginação por cursor sem quebrar o contrato.

### 6.3 Concorrência e integridade

- Toda mutação que envolve mais de uma linha ou verificação-depois-escrita roda em **transação**.
- Operações que alteram **posições** ou **existência de listas e cards** (criar/mover/excluir lista; criar/mover/excluir card; excluir lista com contagem; mudanças de membros e de papéis) obtêm primeiro um **bloqueio pessimista de escrita na linha do quadro** (`FOR UPDATE`). Isso serializa essas operações por quadro, garantindo ordem consistente sem duplicatas ou perdas (B8), contagem de exclusão confiável (RN-X2) e a regra do último Administrador sem corrida (RN-B4, CA-M5). A ordem de bloqueio é sempre quadro primeiro, evitando *deadlock*.
- Edições de campos simples (título, descrição, prazo, conclusão, texto de item, marcação de item) **não** bloqueiam o quadro: última escrita vence (B9).
- Violação de unicidade (`23505`) em e-mail, nome de etiqueta ou vínculo de membro é capturada e convertida no erro de domínio correspondente; nunca vaza como 500 (B11).

### 6.4 Escalabilidade

- API sem estado (sessão em banco) → escala horizontalmente; o serializador por quadro é o banco, não a memória do processo.
- O *pool* de conexões do TypeORM tem tamanho configurado explicitamente, e o total de conexões das instâncias deve caber no limite do PostgreSQL.
- O limite de taxa em memória é suficiente para uma instância; com várias instâncias seria necessário um repositório compartilhado (fora do escopo).
- O bloqueio por quadro limita a concorrência de reordenação **dentro de um mesmo quadro**, aceitável para o perfil de uso (equipes pequenas por quadro); quadros distintos não se bloqueiam.

### 6.5 Acessibilidade e usabilidade (requisitos não funcionais do front)

- Todo arrastar tem alternativa por teclado (sensores de teclado do `@dnd-kit`).
- Diálogos de confirmação (exclusão de quadro, de lista com cards e de card) prendem o foco, fecham com `Esc` e têm texto explícito: o de lista informa a quantidade de cards e que eles serão excluídos (B24).
- Atraso nunca é sinalizado apenas por cor: usa também ícone e texto (P3). Etiquetas exibem o nome, não só a cor.
- A interface é utilizável a partir de 360 px de largura (colunas do quadro com rolagem horizontal).
- Todos os textos da interface em português do Brasil.
- Estados de carregamento, vazio e erro tratados em toda tela (B21, B37, CA-E10, B32).

---

## 7. Decisões técnicas e alternativas descartadas

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Sessão opaca no banco, cookie `HttpOnly` | JWT no `localStorage` ou em cookie | Logout e expiração imediatos; papel nunca desatualizado; token fora do alcance de JavaScript (XSS). |
| Rewrite do Next para `/api` (mesma origem) | Navegador chamando a porta 3333 com CORS | Cookie de primeira parte, `proxy.ts` enxerga a sessão, sem CORS em produção. |
| Posições inteiras densas + bloqueio do quadro | Indexação fracionária | Mais simples de raciocinar e de testar; a contenção por quadro é pequena. |
| Bloqueio de linha do quadro | Controle otimista com versão | Corresponde ao requisito B8 com menos código e sem retentativas no cliente. |
| `confirmCards` na exclusão de lista | Confirmação só no front | O servidor garante que a confirmação refere-se à quantidade real, mesmo sob concorrência. |
| Filtro, progresso e atraso no cliente | Calculados no servidor | O "dia atual" é o do visualizador (RN-D3); o quadro já vem completo numa chamada. |
| Checklists e itens sem `position` | Reordenação | A especificação pede ordem de criação e não prevê reordenar. |
| `scrypt` nativo | `bcrypt`/`argon2` | Sem módulo nativo a instalar e sem truncamento em 72 bytes. |
| `board_id` denormalizado em `cards` | Resolver o quadro por *join* em `lists` | Autorização e carga do quadro mais baratas; imutável, logo sem risco de divergência. |
| Todo o front como Client Components com React Query | Server Components buscando dados | Um só caminho de cookies e de tratamento de 401; interface é altamente interativa. |

---

## 8. Restrições obrigatórias da implementação

**Arquitetura e código**

- **R-01.** Back-end em camadas: rota → validação → serviço → entidade. Regras de negócio **somente** em serviços; rotas não consultam o banco.
- **R-02.** Entidades ficam planas em `back-end/src/entities/` (compatível com o glob atual do `DataSource`).
- **R-03.** Um módulo não acessa tabelas de outro; usa o serviço dele ou o serviço de acesso.
- **R-04.** No front, apenas `lib/api` conhece `axios` e URLs; páginas autenticadas são Client Components; Server Components não chamam a API.
- **R-05.** Regras de progresso (RN-D1) e de atraso (RN-D3) existem em **um** lugar cada no front (`lib/progress`, `lib/dates`). Datas `YYYY-MM-DD` são comparadas como texto contra o "hoje" local; nunca convertidas por `new Date("YYYY-MM-DD")`, que interpreta como UTC.
- **R-06.** Antes de escrever código do Next, ler a documentação em `front-end/node_modules/next/dist/docs/` (convenção `proxy`, não `middleware`).
- **R-07.** O visual segue o protótipo `protoripo.pen`, lido apenas pelas ferramentas MCP do Pencil.
- **R-08.** Toda dependência nova da seção 1 é efetivamente instalada com `npm install` no pacote correspondente (e declarada em `package.json`); nenhuma é apenas assumida.

**Dados**

- **R-09.** PostgreSQL com TypeORM; esquema, índices, FKs e cascatas conforme a seção 3. Cascatas por FK (`ON DELETE CASCADE`).
- **R-10.** `synchronize` só fora de produção. Nenhuma alteração de esquema fora das entidades.
- **R-11.** E-mail gravado normalizado e com UNIQUE; nome de etiqueta único por quadro via `name_key`; um vínculo por usuário e quadro.
- **R-12.** `cards.board_id` nunca é alterado após a criação; mover card só é permitido dentro do mesmo quadro.
- **R-13.** `position` é inteiro denso 0-based por contêiner, ajustado ao intervalo válido, sem UNIQUE.

**Contratos**

- **R-14.** Prefixo `/api`, JSON, UUIDs, datas conforme 4.1; os caminhos, os papéis mínimos, os status e os DTOs da seção 4 são o contrato. Mudanças exigem atualizar este plano.
- **R-15.** Todo erro segue o formato 4.2 com `code` estável. Id malformado → 404. Nunca vazar 500 por erro previsível.
- **R-16.** Não existem endpoints de edição/exclusão de comentário nem de filtro por etiqueta.
- **R-17.** Servidor nunca devolve `password_hash`, `token_hash` ou stack trace.

**Segurança**

- **R-18.** Toda rota (exceto `register`, `login`, `health`) exige sessão válida; toda rota de recurso passa pelo serviço de acesso (404 sem vínculo, 403 com papel insuficiente) e o papel é lido do banco em cada requisição.
- **R-19.** Sessão: token aleatório, só o hash no banco, cookie `HttpOnly`/`SameSite=Lax`/`Secure` em produção, expiração deslizante de 30 dias, logout apaga a linha.
- **R-20.** Senha com `scrypt`, sal por usuário, comparação em tempo constante, 8–128 caracteres, nunca registrada nem devolvida.
- **R-21.** Validação `zod` de toda entrada; só consultas parametrizadas; sem `dangerouslySetInnerHTML`.
- **R-22.** CORS restrito a `WEB_ORIGIN`; checagem de `Origin` em métodos não seguros; `helmet`; limite de taxa nas rotas de autenticação e geral.
- **R-23.** Falha de login com mensagem única para e-mail inexistente e senha incorreta.
- **R-24.** Sem segredos em código; variáveis validadas na partida; logs sem corpo, cookie, senha ou token.

**Regras de negócio**

- **R-25.** Excluir lista com cards só ocorre quando `confirmCards` for igual à contagem real, medida dentro da transação com o quadro bloqueado; caso contrário `409 LIST_NOT_EMPTY` e nada é excluído. Os cards são excluídos junto, não migrados.
- **R-26.** Remover ou rebaixar membro, com checagem do último Administrador, e remoção das atribuições dele no quadro, ocorrem em **uma** transação com o quadro bloqueado.
- **R-27.** Operações de posição/existência de listas e cards bloqueiam a linha do quadro primeiro. Edições simples não bloqueiam.
- **R-28.** Convite exige conta existente e adesão imediata. Atribuição exige membro do quadro. Etiqueta só em cards do mesmo quadro.
- **R-29.** Progresso do card agrega todos os itens de todas as checklists; marcar tudo **não** conclui o card. O servidor devolve contagens, o cliente calcula `floor(checked × 100 / total)` e exibe "sem itens" quando o total é 0.
- **R-30.** "Atrasado" é calculado no cliente (prazo < hoje local e card não concluído) e aplicado ao card na lista, ao card aberto e ao resumo do quadro.
- **R-31.** O filtro por etiqueta é por união, local e não persistido; limpar restaura a visão.

**Desempenho e qualidade**

- **R-32.** `GET /api/boards/:id` usa número constante de consultas (≤ 8). Sem N+1. Índices da seção 3 presentes.
- **R-33.** Mutações de várias linhas rodam em transação; violações de unicidade viram erros de domínio.
- **R-34.** Mover e reordenar são otimistas no front, com *rollback* em erro, e têm alternativa por teclado.
- **R-35.** Atraso não é indicado só por cor; interface em pt-BR e utilizável a partir de 360 px.
- **R-36.** `npx tsc --noEmit` e `npm run build`, em `back-end/` e em `front-end/`, **DEVEM** concluir sem erros. Estes são os únicos comandos de verificação permitidos ao agente; ele não executa a aplicação, os endpoints nem fluxos de API.

---

## 9. Ordem de construção sugerida

Cada incremento entrega back-end e front-end completos da sua parte, e deixa o sistema compilando.

1. **Fundação:** `config/env`, `app.ts`, erros e tratador central, middlewares de segurança, entidades `users`/`sessions`, módulo `auth`, `proxy.ts`, páginas de login e cadastro, cliente `api`, React Query. *(C1–C5, CA-C\*)*
2. **Quadros e membros:** entidades de quadro e membro, serviço de acesso, módulos `boards` e `members`, lista e criação de quadros, tela de membros. *(Q1–Q5, M1–M3, CA-Q\*, CA-M1…M7)*
3. **Listas e cards:** ordenação com bloqueio por quadro, módulos `lists` e `cards`, `BoardDetail` completo, quadro com arrastar e soltar, diálogo de exclusão de lista. *(L1–L4, K1–K6, CA-L\*, CA-K\*)*
4. **Enriquecimento do card:** `checklists`, `labels` e filtro, responsáveis, `comments`, prazo e atraso, conclusão. *(CK, E, M4–M5, CM, P, CA-CK\*, CA-E\*, CA-M8…M12, CA-CM\*, CA-P\*)*

---

## 10. Rastreabilidade

| Área da especificação | Seções do plano |
|---|---|
| 3.1 Conta e sessão (C1–C5) | 4.4 Autenticação, 5.1, 5.2, 2.5, R-18…R-20, R-23 |
| 3.2 Quadros (Q1–Q5) | 3.2 `boards`/`board_members`, 4.4 Quadros, 2.5 (404) |
| 3.3 Listas (L1–L4) | 3.4, 4.4 Listas, 6.3, R-13, R-25, R-27 |
| 3.4 Cards (K1–K6) | 3.2 `cards`, 4.4 Cards, R-12, R-13 |
| 3.5 Checklists (CK1–CK5) | 3.2 `checklists`/`checklist_items`, 4.4 Checklists, R-29 |
| 3.6 Membros (M1–M5) | 4.4 Membros e Responsáveis, 6.3, R-26, R-28 |
| 3.7 Etiquetas e filtro (E1–E4) | 3.2/3.3, 4.4 Etiquetas, R-28, R-31 |
| 3.8 Comentários (CM1–CM3) | 3.2 `comments`, 4.4 Comentários, R-16 |
| 3.9 Prazos (P1–P4) | `cards.due_date`, 2.4, R-05, R-30 |
| 5 Regras de negócio | 3 (modelo), 6.3 (concorrência), 8 (restrições) |
| 6 Casos de borda | 4.2 (erros), 4.6, 6.3, 6.5 |
