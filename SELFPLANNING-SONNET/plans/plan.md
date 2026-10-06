# Plano — Sistema Kanban (RF01–RF10)

Escopo: back-end (Express 5 + TypeORM + PostgreSQL) e front-end (Next.js 16 + Tailwind 4 + axios) implementados juntos, task a task, conforme `context.md`. UI/UX inspirada em `protoripo.pen` (lido via MCP Pencil).

## 0. Escopo e premissas

- **Intenções fora do escopo.** O texto recebido traz também as intenções "finalizar pedido com cálculo de frete" e "histórico de pedidos por período". Elas pertencem a um domínio de e-commerce e não aparecem em `RF.md`, no protótipo nem no código existente. Foram tratadas como sobra de colagem e **não entram neste plano**. Se forem desejadas, devem virar um plano à parte.
- **Estado atual.** `back-end/` tem só `main.ts` (Express + CORS + `AppDataSource.initialize()`), `database.ts` (TypeORM postgres, `synchronize: true`, entidades em `src/entities/*.{ts,js}`) e `docker-compose.yml` (bitnami/postgresql, credenciais do `.env`). `front-end/` é um Next 16 padrão com `axios` instalado. Nenhuma entidade, rota ou tela existe.
- **Restrições de execução** (`context.md`): só rodar `tsc` e `npm run build`, corrigindo apenas erros de import ou dependência. Não rodar testes, endpoints nem fluxo de API. Dependência nova sempre com `npm install`.
- **Next 16.** `front-end/AGENTS.md` avisa que a versão tem breaking changes. Antes de escrever código do front-end, ler o guia relevante em `front-end/node_modules/next/dist/docs/` (rotas dinâmicas `[boardId]`, Client Components, `params` assíncrono).

## 1. Decisões de design

| Tema | Decisão |
| --- | --- |
| Sessão persistente (RF01) | Access token JWT curto (15 min) + refresh token opaco de longa duração, guardado com hash no banco (`refresh_tokens`) e rotacionado a cada uso. "Manter-me conectado" marcado: refresh em `localStorage` (30 dias). Desmarcado: `sessionStorage` (1 dia). |
| Senhas | `bcryptjs` (sem binário nativo). |
| Validação | `zod` nos corpos e parâmetros de todas as rotas. |
| Papéis (RF07) | `ADMIN` e `MEMBER` na tabela `board_members`. Quem cria o quadro vira `ADMIN`. Nunca deixar o quadro sem administrador: bloquear remoção ou rebaixamento do último. |
| Convite (RF07) | O admin informa o e-mail de um usuário **já cadastrado** e o papel. Usuário inexistente retorna 404 com mensagem clara. Convite com aceite fica fora do escopo. |
| Matriz de permissões | **ADMIN**: tudo, incluindo editar ou excluir o quadro, gerenciar membros, criar, renomear, reordenar e excluir listas, e gerenciar etiquetas. **MEMBER**: ver o quadro, criar, editar, mover e excluir cards, checklists, comentários, atribuir membros, aplicar etiquetas. Comentário só é excluído pelo autor ou por um admin. |
| Exclusão de lista com cards (RF05) | Regra explícita: `DELETE /lists/:id` sem estratégia e com cards retorna **409** com `{ cardCount }`. O cliente reenvia com `?strategy=delete` (apaga os cards em cascata) ou `?strategy=move&targetListId=` (migra os cards ao fim da lista alvo, do mesmo quadro). O modal "Excluir lista" do protótipo apresenta as duas opções. |
| Ordenação (RF03/RF04) | Coluna `position` inteira em listas e cards. Reordenar e mover rodam em transação e renumeram `0..n-1` da lista afetada. O endpoint recebe o índice de destino. |
| Atraso (RF10) | Calculado no back-end: `isOverdue = dueDate < início do dia atual`; `isDueSoon = vence nas próximas 72 h`. O front só colore. Não existe flag de "card concluído" nos RFs, então a coluna "Concluído" não suprime o atraso. Ponto aberto no fim do plano. |
| Progresso (RF06) | Percentual calculado no back-end (`done/total` somando todos os itens de todas as checklists do card) e devolvido no card. Sem checklist, o progresso é `null`. |
| Banco | `synchronize: true` já está configurado e basta para o TCC. Sem migrations. |
| Erros | Middleware central com `AppError(status, message)`; erros do `zod` viram 400. |

## 2. Modelo de dados (TypeORM, `src/entities/`)

- **User**: `id` (uuid), `name`, `email` (único, minúsculo), `passwordHash`, `createdAt`.
- **RefreshToken**: `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt?`, `createdAt`.
- **Board**: `id`, `name`, `description?`, `createdAt`.
- **BoardMember**: `id`, `boardId`, `userId`, `role` (`ADMIN | MEMBER`), único em (`boardId`, `userId`).
- **List**: `id`, `boardId`, `name`, `position`. Cascata do quadro.
- **Card**: `id`, `listId`, `title`, `description?`, `position`, `dueDate?` (timestamp), `createdAt`. Relações: `labels` (ManyToMany `card_labels`), `assignees` (ManyToMany `card_assignees` com `User`). Cascata da lista só quando `strategy=delete`.
- **Checklist**: `id`, `cardId`, `title`, `position`. **ChecklistItem**: `id`, `checklistId`, `text`, `done`, `position`.
- **Label**: `id`, `boardId`, `name`, `color` (hex validado). Cascata do quadro.
- **Comment**: `id`, `cardId`, `authorId`, `content`, `createdAt`.

Regra de integridade: todo recurso aninhado resolve o `boardId` de origem e checa a filiação do usuário nele (ver seção 3, middleware `boardAccess`). Atribuição de membro e aplicação de etiqueta só aceitam membros e etiquetas do mesmo quadro do card.

## 3. Back-end

### 3.1 Dependências a instalar (`back-end/`)

`bcryptjs`, `jsonwebtoken`, `zod`; dev: `@types/jsonwebtoken`. Adicionar `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_TTL_DAYS` ao `.env`.

### 3.2 Estrutura

```
src/
  main.ts            // registra rotas e o errorHandler
  database.ts
  config/env.ts      // lê e valida variáveis
  entities/          // as entidades acima
  middlewares/       // authenticate, boardAccess(role?), errorHandler, validate
  modules/
    auth/            // routes, service
    boards/          // boards + members
    lists/
    cards/           // cards + assignees + due date + labels no card
    checklists/
    labels/
    comments/
  utils/             // AppError, tokens, reorder
```

Cada módulo: `*.routes.ts` (Router + zod) e `*.service.ts` (regra e acesso ao `AppDataSource`). Sem camada de repositório extra.

### 3.3 Rotas

**Auth (RF01)** — públicas, exceto `me`
- `POST /auth/register` `{ name, email, password }` → 201 com usuário, `accessToken`, `refreshToken`. E-mail repetido retorna 409.
- `POST /auth/login` `{ email, password, remember }` → tokens (TTL do refresh conforme `remember`).
- `POST /auth/refresh` `{ refreshToken }` → novo par, revogando o anterior. Token revogado ou expirado retorna 401.
- `POST /auth/logout` `{ refreshToken }` → revoga.
- `GET /auth/me` → usuário autenticado (para reidratar a sessão).

**Quadros (RF02)**
- `GET /boards` → quadros do usuário com `role`, `listCount`, `cardCount`, `overdueCount`.
- `POST /boards` `{ name, description? }` → cria e vira `ADMIN` (transação).
- `GET /boards/:id` → quadro completo: listas ordenadas, cards (com `labels`, `assignees`, `progress`, `dueDate`, `isOverdue`, `isDueSoon`, `commentCount`), etiquetas, membros e o `role` do usuário.
  - Query opcional: `labelIds=a,b` (filtro, RF08) e `sort=dueDate` (RF10; cards sem prazo por último). O filtro também roda no cliente, sobre os dados já carregados, para resposta imediata.
- `PATCH /boards/:id` e `DELETE /boards/:id` → só `ADMIN`.

**Membros (RF07)** — `ADMIN`, exceto a listagem
- `GET /boards/:id/members`
- `POST /boards/:id/members` `{ email, role }`
- `PATCH /boards/:id/members/:userId` `{ role }`
- `DELETE /boards/:id/members/:userId` (um membro pode remover a si mesmo, "sair do quadro", salvo se for o último admin). Ao remover, tirar o usuário dos `card_assignees` do quadro.

**Listas (RF03/RF05)** — escrita só `ADMIN`
- `POST /boards/:id/lists` `{ name }` (posição no fim)
- `PATCH /lists/:id` `{ name }`
- `PATCH /lists/:id/move` `{ position }`
- `DELETE /lists/:id?strategy=delete|move&targetListId=`

**Cards (RF04/RF10)**
- `POST /lists/:id/cards` `{ title, description?, dueDate? }`
- `GET /cards/:id` → detalhe com checklists e itens, comentários, etiquetas e atribuídos.
- `PATCH /cards/:id` `{ title?, description?, dueDate? | null }`
- `PATCH /cards/:id/move` `{ listId, position }` → `listId` precisa ser do **mesmo quadro**; senão 400.
- `DELETE /cards/:id`
- `PUT /cards/:id/assignees` `{ userIds }` → membros do quadro (RF07).
- `PUT /cards/:id/labels` `{ labelIds }` → etiquetas do quadro (RF08).

**Checklists (RF06)**
- `POST /cards/:id/checklists` `{ title }` · `PATCH /checklists/:id` · `DELETE /checklists/:id`
- `POST /checklists/:id/items` `{ text }` · `PATCH /items/:id` `{ text?, done? }` · `DELETE /items/:id`
- Cada resposta devolve o `progress` atualizado do card, para o front não recalcular.

**Etiquetas (RF08)**
- `GET /boards/:id/labels` · `POST /boards/:id/labels` `{ name, color }` · `PATCH /labels/:id` · `DELETE /labels/:id` (gerenciar é só `ADMIN`).

**Comentários (RF09)**
- `GET /cards/:id/comments` → cronológico ascendente, com `author { id, name }`.
- `POST /cards/:id/comments` `{ content }` · `DELETE /comments/:id` (autor ou `ADMIN`).

### 3.4 Passos de implementação

1. Instalar dependências, ajustar `.env`, criar `config/env.ts`, `AppError`, `errorHandler`, `validate`.
2. Criar todas as entidades e registrá-las; conferir os relacionamentos com `tsc`.
3. `modules/auth` + middleware `authenticate` (valida Bearer e injeta `req.user`).
4. Middleware `boardAccess(role?)`: resolve o `boardId` a partir de `:id` do quadro, da lista, do card, da checklist, do item, da etiqueta ou do comentário e checa a filiação e o papel.
5. Módulos na ordem: boards (+ members) → lists → cards → checklists → labels → comments.
6. Serialização do card (progresso, `isOverdue`, `isDueSoon`) numa função única reutilizada por `GET /boards/:id` e `GET /cards/:id`.
7. `main.ts`: montar rotas, `errorHandler` por último. Rodar `npx tsc --noEmit` e `npm run build` ao fim de cada módulo.

## 4. Front-end

### 4.1 Dependências (`front-end/`)

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (arrastar cards entre listas e reordenar listas). `axios` já existe. Ícones: `lucide-react`.

### 4.2 Tokens e componentes (do protótipo)

Em `globals.css`, `@theme` com as variáveis do `.pen`: `navy #1D3557`, `page-bg #EEF0F4`, `surface #FFFFFF`, `surface-alt #F6F7FA`, `border #E2E5EB`, `ink #1A1F2C`, `body #3F4756`, `muted #6B7280`, `placeholder #9AA1AD`, `red #C8423A` (+ `red-bg`, `red-dark`), `blue`, `green`, `amber` (+ `amber-text`, `amber-bg`), `purple`, `slate`, e os pares `*-bg`.

Componentes em `src/components/ui/`, espelhando os reutilizáveis do protótipo: `Logo`, `Avatar`, `IconButton`, `Button` (variantes primário, secundário, perigo), `Field` (input com label e erro), `Select`, `Checkbox`, `LabelChip` (etiqueta colorida), `Modal` (overlay, Esc e clique fora fecham).

### 4.3 Estrutura e rotas

```
src/
  lib/api.ts            // axios + interceptors
  lib/auth.tsx          // AuthProvider, useAuth
  lib/types.ts          // tipos espelhando as respostas do back-end
  app/
    layout.tsx          // fontes + AuthProvider
    page.tsx            // redireciona: /quadros se autenticado, senão /login
    login/page.tsx
    cadastro/page.tsx
    quadros/page.tsx
    quadros/[boardId]/page.tsx
  components/
    ui/
    boards/             // BoardCard, NewBoardModal, BoardHeader
    kanban/             // BoardView, ListColumn, CardItem, NewListModal, DeleteListModal,
                        //   LabelFilterBar, LabelsModal, MembersModal
    card/               // CardDetailModal, ChecklistSection, CommentsSection,
                        //   AssigneePicker, LabelPicker, DueDateField
```

### 4.4 Autenticação e sessão (RF01)

- `lib/api.ts`: instância axios com `baseURL` vinda de `NEXT_PUBLIC_API_URL`. O interceptor de request injeta `Authorization: Bearer`. O interceptor de response trata 401 chamando `/auth/refresh` **uma única vez** (fila de requisições pendentes), repete a original e, se o refresh falhar, limpa a sessão e vai para `/login`.
- `AuthProvider`: ao montar, lê o refresh token (`localStorage`, depois `sessionStorage`), chama `/auth/refresh` e `/auth/me` para reidratar. Expõe `user`, `loading`, `login`, `register`, `logout`.
- Guarda de rota no cliente: páginas em `/quadros/**` redirecionam para `/login` sem usuário. `/login` e `/cadastro` redirecionam para `/quadros` com usuário.
- Telas `login` e `cadastro`: layout do protótipo (painel de marca de um lado, formulário do outro). A tela de login traz o checkbox "Manter-me conectado neste dispositivo". O cadastro confirma a senha no cliente. Erros do back-end aparecem no campo ou em um aviso do formulário.

### 4.5 Telas

- **Meus quadros** (`/quadros`): cabeçalho com busca, usuário e botão "Novo quadro". Subtítulo "N quadros · você é administrador em M". Grade de cartões com nome, resumo ("5 listas · 11 cards · 2 atrasados"), selo `ADMIN`/`MEMBRO` e menu de ações do administrador (renomear, excluir com confirmação). Modal "Novo quadro". A busca filtra por nome do quadro no cliente.
- **Quadro** (`/quadros/[boardId]`):
  - Barra superior: "Quadros" (voltar), nome do quadro, botões "Etiquetas" e "Membros" (ações de gestão só para `ADMIN`).
  - Faixa de filtro por etiqueta (chips, "Todas" + etiquetas do quadro, seleção múltipla), contador "N cards no quadro" e alternância "Ordenar por prazo".
  - Colunas com título, contador, menu da lista (renomear, excluir — `ADMIN`) e "Adicionar card" inline. Coluna "Nova lista" ao fim (`ADMIN`).
  - `CardItem`: etiquetas, título, barra e texto de progresso do checklist (`2/4`), data de vencimento com destaque (vermelho "Atrasado há N dias", âmbar "Vence em breve"/próximo, neutro caso contrário), avatares dos atribuídos, contador de comentários.
  - Arrastar com dnd-kit: cards entre listas e dentro da lista, listas entre si (`ADMIN`). Atualização otimista; em erro, reverter e avisar.
- **Modal "Excluir lista"**: lista vazia → confirmação simples. Com cards → escolha entre "Excluir também os N cards" e "Mover os cards para…" (select das outras listas); sem opção válida, o botão fica desabilitado. Usa a regra do 409 da seção 3.3.
- **Modal "Etiquetas"**: lista de etiquetas com cor, criar, editar e excluir (paleta fixa de cores do protótipo mais campo hex).
- **Modal "Membros"**: lista com papel, convite por e-mail + papel, alterar papel e remover (`ADMIN`); `MEMBRO` só visualiza e pode sair.
- **Modal "Detalhe do card"**: título e descrição editáveis; seletor de etiquetas; seletor de membros atribuídos; campo de data de vencimento (com "remover prazo"); seções de checklists (criar, itens marcáveis, adicionar e excluir, barra de percentual); comentários (histórico cronológico com avatar, nome do autor e data, campo de novo comentário, excluir o próprio); excluir card com confirmação.

### 4.6 Passos de implementação

1. Ler o guia do Next 16 em `node_modules/next/dist/docs/`. Instalar `@dnd-kit/*` e `lucide-react`. Definir tokens e componentes `ui/`.
2. `lib/api.ts`, `lib/types.ts`, `AuthProvider`; telas `login` e `cadastro`; guardas de rota.
3. `/quadros` e `NewBoardModal`.
4. `BoardView` estático (listas e cards com tudo exibido) com dados reais do `GET /boards/:id`.
5. Mutações de listas e cards (criar, renomear, excluir, mover) e drag and drop; `DeleteListModal`.
6. `CardDetailModal` com checklists, atribuição, etiquetas, prazo e comentários.
7. `LabelsModal`, `MembersModal`, filtro por etiqueta e ordenação por prazo.
8. `npx tsc --noEmit` e `npm run build` a cada etapa significativa, corrigindo só erros de import ou dependência.

## 5. Ordem de execução fim a fim (fatias verticais)

Cada fatia entrega back-end e front-end juntos, como exige `context.md`.

1. **Fundação e RF01**: entidades `User`/`RefreshToken`, módulo `auth`, `lib/api`, `AuthProvider`, telas de login e cadastro.
2. **RF02**: `Board` e `BoardMember`, rotas de quadros, tela "Meus quadros" e modal "Novo quadro".
3. **RF03 + RF05**: `List`, rotas de listas, `BoardView` com colunas, "Nova lista" e "Excluir lista" com estratégia.
4. **RF04**: `Card`, rotas de cards e `move`, drag and drop, "Adicionar card".
5. **RF06**: `Checklist`/`ChecklistItem`, progresso no card e no modal de detalhe.
6. **RF07**: gestão de membros, papéis aplicados no `boardAccess`, atribuição a cards, modal "Membros".
7. **RF08**: `Label`, modal "Etiquetas", seletor no card, filtro por etiqueta.
8. **RF09**: `Comment` e seção de comentários no detalhe do card.
9. **RF10**: `dueDate`, `isOverdue`/`isDueSoon`, destaque visual e "Ordenar por prazo".
10. Revisão final: `tsc` e `build` nos dois projetos; conferir que nenhum RF ficou sem back-end ou sem tela.

## 6. Mapa RF → entrega

| RF | Back-end | Front-end |
| --- | --- | --- |
| RF01 | `auth/*`, `RefreshToken` | login, cadastro, `AuthProvider`, interceptor de refresh |
| RF02 | `boards/*` | Meus quadros, Novo quadro |
| RF03 | `lists/*` (criar, renomear, mover, excluir) | colunas, menu da lista, drag de listas |
| RF04 | `cards/*`, `move` | `CardItem`, drag de cards, detalhe |
| RF05 | `DELETE /lists/:id` com `strategy` (409 sem estratégia) | modal Excluir lista |
| RF06 | `checklists/*`, `progress` | checklist no modal, barra no card |
| RF07 | `boards/:id/members`, `boardAccess`, `assignees` | modal Membros, seletor de atribuídos |
| RF08 | `labels/*`, `PUT cards/:id/labels`, filtro | modal Etiquetas, chips de filtro |
| RF09 | `comments/*` | seção de comentários |
| RF10 | `dueDate`, `isOverdue`, `isDueSoon`, `sort=dueDate` | campo de prazo, destaque, ordenação |

## 7. Pontos abertos (padrão adotado se não houver resposta)

1. **Atraso em card concluído.** Sem flag de conclusão nos RFs, qualquer card com prazo vencido é "atrasado", inclusive na coluna "Concluído". Padrão: manter assim.
2. **Convite de usuário não cadastrado.** Padrão: 404 pedindo que a pessoa se cadastre primeiro, sem convite por e-mail com aceite.
3. **Intenções de pedido e frete.** Padrão: fora do escopo (ver seção 0).
