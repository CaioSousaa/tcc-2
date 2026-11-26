# Plano Técnico: Gerenciador de Quadros de Tarefas

Fase 2 (Plan). Este documento responde **como** construir o que `docs/spec.md` define. Onde a especificação declara intenção, este plano declara as **restrições** que a implementação deve obedecer. Tudo o que está marcado como **Restrição (RT-xx)** é obrigatório; o que não está marcado é recomendação que pode ser ajustada sem rever o plano.

Referências cruzadas usam os identificadores da especificação (RF, CA, RN, CB).

## 0. Ponto de partida e premissas

O repositório já contém dois projetos esqueleto, que este plano adota e estende em vez de substituir:

| Projeto | Estado atual |
|---|---|
| `back-end/` | Node + TypeScript (CommonJS, `strict`, decorators ligados), Express 5, TypeORM, `pg`, `cors`, `dotenv`. Possui `src/main.ts`, `src/database.ts` (DataSource PostgreSQL lendo `.env`, entidades em `src/entities/*`), `docker-compose.yml` (PostgreSQL) e `.env` (porta 3333). Sem entidades, rotas nem autenticação. |
| `front-end/` | Next.js 16.3.4 (App Router), React 19, Tailwind CSS 4, axios, `NEXT_PUBLIC_API_URL=http://localhost:3333`. Sem páginas além do modelo inicial. |

Premissas:

- Back-end e front-end são **processos separados** (API na porta 3333, interface na porta 3000 em desenvolvimento).
- Cada funcionalidade é entregue com back-end **e** front-end juntos (`context.md`, regra 1).
- A interface segue o protótipo `protoripo.pen` (somente via MCP do Pencil). Em conflito de **comportamento**, a especificação prevalece sobre o protótipo.
- O agente que implementa verifica o trabalho apenas com `tsc` e `npm run build`. Não executa testes da aplicação (`context.md`, regra 3). Por isso o plano privilegia regras verificáveis por tipos e por restrições de banco.
- A interface e as mensagens ao usuário são em **português do Brasil**.

## 1. Tecnologias e frameworks

### 1.1 Escolhas

| Camada | Escolha | Justificativa |
|---|---|---|
| Linguagem | TypeScript `strict` nos dois projetos | Já configurado. Tipos reduzem erros que o agente não pode pegar executando testes. |
| API | Express 5 | Já instalado. Trata erros de handlers assíncronos nativamente. |
| Persistência | PostgreSQL + TypeORM | Exigido por `context.md`. O modelo é fortemente relacional, com integridade referencial e cascata. |
| Validação de entrada | `zod` | Um schema por endpoint produz validação e tipos, e mensagens por campo (CA-03, CB-03). |
| Senhas | `scrypt` do módulo `node:crypto` | Função de derivação com custo de memória, sem dependência nativa para compilar. |
| Sessão | Sessão **no servidor** (tabela `sessions`) com token opaco em cookie `HttpOnly` | Permite logout imediato real (RN-04), expiração fixa de 7 dias e revogação. Um JWT sem estado não garante o logout imediato. |
| Cabeçalhos e abuso | `helmet`, `express-rate-limit`, `cookie-parser` | Cabeçalhos de segurança, limite de tentativas em autenticação, leitura do cookie de sessão. |
| Interface | Next.js 16 (App Router), React 19, Tailwind 4 | Já instalados. |
| Cliente HTTP | axios (instalado) com `withCredentials` | Envia o cookie de sessão à API em outra origem. |
| Arrastar e soltar | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Suporta teclado e toque, ao contrário do arrastar nativo do HTML. |
| Estado da interface | React (estado local, contexto e reducer). Sem biblioteca de estado global | O escopo não justifica. O estado relevante é o quadro aberto. |

### 1.2 Dependências novas

- **Restrição RT-01.** Toda dependência necessária deve ser instalada com `npm install` no projeto correspondente (`context.md`, regra 4). Nenhuma pode ser apenas importada sem estar no `package.json`.
  - Back-end (produção): `zod`, `helmet`, `express-rate-limit`, `cookie-parser`.
  - Back-end (desenvolvimento): `@types/cookie-parser`.
  - Front-end (produção): `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Restrição RT-02.** As APIs instaladas diferem do que costuma ser conhecido: TypeORM está na série 1.x, Next.js na 16 (o antigo *middleware* chama-se **proxy**) e `front-end/AGENTS.md` exige ler `node_modules/next/dist/docs/` antes de escrever código de Next. Antes de usar uma API dessas bibliotecas, confirmar a assinatura nos tipos ou na documentação **instalados**.

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador ──(páginas)──────────────▶ Next.js (front-end, :3000)
    │
    └──(JSON + cookie de sessão)───▶ API Express (back-end, :3333) ──▶ PostgreSQL (docker-compose)
```

- O Next.js entrega a interface e **não** acessa o banco. Todo dado passa pela API.
- A API é a **única** guardiã das regras de negócio e das permissões. A interface esconde controles por conveniência, mas nunca é a barreira (RN-08).
- O navegador chama a API diretamente (CORS com credenciais). O servidor do Next não repassa chamadas à API.

### 2.2 Back-end: camadas e fronteiras

```
back-end/src/
  main.ts                 inicialização (env, banco, app, limpeza de sessões)
  app.ts                  montagem do Express (middlewares, rotas, tratador de erros)
  database.ts             DataSource (existente)
  config/env.ts           leitura e validação das variáveis de ambiente
  entities/               uma entidade TypeORM por arquivo (glob existente: entities/*)
  shared/
    errors.ts             AppError e catálogo de códigos de erro
    policy.ts             matriz de permissões (única fonte de RN-07)
    board-access.ts       resolução de recurso → quadro → papel do usuário
    validation.ts         limites de texto, contagem por pontos de código, helpers de zod
    ordering.ts           operações de posição densa (inserir, mover, remover)
    http.ts               middlewares: autenticação, verificação de Origin, tratador de erros
  modules/
    auth/ boards/ members/ lists/ cards/ checklists/ labels/ comments/
      <modulo>.routes.ts      rotas e schemas zod
      <modulo>.controller.ts  traduz HTTP ↔ serviço
      <modulo>.service.ts     regras de negócio e transações
```

**Restrição RT-03 (fronteiras).**
- *Rotas/controladores* só fazem: validar entrada (zod), chamar um serviço, devolver a resposta. Não contêm regra de negócio nem acessam repositórios.
- *Serviços* contêm todas as regras e transações. Não importam tipos do Express.
- *Entidades* só descrevem o modelo. Sem lógica de negócio.
- Um módulo não acessa as entidades de outro por atalho. Usa o serviço do outro ou o helper compartilhado de `shared/`.

**Restrição RT-04 (autorização central).** Toda rota, exceto cadastro e login, passa por autenticação. Toda rota que toca dados de um quadro resolve o quadro a partir do recurso pedido e verifica o papel do usuário **na matriz única** `policy.ts`, que codifica RN-07. Nenhum serviço decide permissão com `if` próprio sobre o papel.

**Restrição RT-05 (sem acesso por identificador solto).** Nenhuma consulta busca um card, lista, checklist, item, etiqueta ou comentário apenas pelo identificador. Toda busca passa pela resolução de quadro e pertencimento (`board-access.ts`), para impedir acesso a dados de outro quadro (IDOR).

**Restrição RT-06 (404 versus 403).**
- Usuário que **não é membro** do quadro: `404`, idêntico ao de um recurso inexistente (RN-10, CA-13).
- Membro **sem permissão** para a ação: `403` (CA-17, CA-53).
- Um identificador mal formado em rota também retorna `404`.

### 2.3 Concorrência e consistência

**Restrição RT-07 (bloqueio por quadro).** Qualquer mutação que altere **ordem** (listas, cards) ou **composição e papéis de membros** executa em uma transação que primeiro obtém um bloqueio de escrita (`SELECT … FOR UPDATE`) na linha do quadro. Isso serializa essas operações por quadro e elimina, sem depender de tempo, os casos CB-11 (ordem consistente com movimentos simultâneos) e CB-12/CA-51 (dois administradores que se rebaixam ao mesmo tempo e deixam o quadro sem administrador).

**Restrição RT-08 (revalidação dentro da transação).** Após obter o bloqueio, o serviço **relê** os recursos envolvidos. Se o card, a lista de destino ou o membro já não existem, a operação falha com `404` (ou `TARGET_LIST_INVALID`) e nada é alterado (CB-08, CB-09, CB-20). O papel do usuário também é relido do banco **a cada requisição**, nunca guardado na sessão (RN-09, CB-12).

**Restrição RT-09 (ordem densa).** `position` é um inteiro denso a partir de 0, por lista (cards) e por quadro (listas). Inserir, mover ou remover renumera os irmãos afetados na mesma transação, de modo que nunca existam duplicatas nem lacunas (RN-13, CA-31, CA-33).
- A posição de destino é o índice na lista de destino **após** retirar o item movido.
- Posição maior que o tamanho clampa ao final (CB-17). Mover para a posição atual é um sucesso sem alteração (CB-16). Posição negativa ou não inteira é erro de validação.

**Restrição RT-10 (última gravação vence).** Edições simultâneas do mesmo campo não usam controle otimista de versão: vale a última gravação (CB-10). Mas cada gravação é atômica e valida a entrada completa (nada parcial, CB-03).

**Restrição RT-11 (transações).** São executadas em uma única transação: criação de quadro + vínculo do administrador; exclusão de lista com migração de cards; movimentação de card; troca/remoção de membro; criação de card com cálculo da posição final.

### 2.4 Front-end: estrutura e fronteiras

```
front-end/src/
  proxy.ts                         guarda otimista de rotas (cookie presente?)
  app/
    layout.tsx                     idioma pt-BR, metadados do sistema
    (auth)/login/page.tsx          login
    (auth)/register/page.tsx       cadastro
    (app)/page.tsx                 lista de quadros
    (app)/boards/[boardId]/page.tsx quadro (listas, cards, filtros, painel de membros e etiquetas)
  components/
    ui/                            botões, campos, diálogo, confirmação, toast, estados vazios
    board/                         listas, cards, arrastar e soltar, filtros, membros, etiquetas
    card/                          painel de detalhes: descrição, checklists, responsáveis,
                                   etiquetas, prazo, comentários
  lib/
    api.ts                         instância axios e tradução de erros
    types.ts                       tipos dos contratos da API
    permissions.ts                 can(papel, ação), espelho da matriz do back-end
    date.ts                        "hoje" local, comparação de prazos
    constants.ts                   limites de texto e paleta de cores de etiquetas
```

**Restrição RT-12 (renderização).** As páginas protegidas buscam dados **no cliente** (componentes cliente chamando a API com axios). O servidor do Next não faz requisições à API em nome do usuário, para não precisar repassar cookies de sessão.

**Restrição RT-13 (rota protegida).** `proxy.ts` redireciona a `/login?next=<caminho>` quando não há cookie de sessão, e redireciona de `/login` e `/register` para `/` quando há. Isso é apenas **verificação otimista**: a validade real é decidida pela API (`401`).
- Uma resposta `401` da API em qualquer chamada leva o usuário a `/login?next=<caminho atual>` sem executar a ação (CB-05).
- O parâmetro `next` só é aceito se for um caminho relativo interno (começa com `/` e não com `//`). Qualquer outro valor é ignorado e o destino padrão é `/` (evita redirecionamento aberto).

**Restrição RT-14 (cartão por URL).** O card aberto é refletido no parâmetro `?card=<id>` do quadro, para que o endereço seja compartilhável e sobreviva à recarga. Cartão inexistente ou sem acesso mostra "não encontrado" e remove o parâmetro (CB-07).

**Restrição RT-15 (filtros no cliente).** Os filtros de etiqueta e de atrasados são aplicados no cliente sobre o quadro já carregado, vivem apenas no estado da tela e não são gravados em lugar nenhum (RN-27, RN-28, CA-67). Lista sem cards visíveis continua renderizada (CA-65). Um filtro ativo tem indicação visível, e o resultado vazio mostra mensagem própria (CA-66). Etiquetas excluídas somem do filtro (CB-33).

**Restrição RT-16 (cálculo de "atrasado" e "Hoje").** O back-end **não** calcula atraso. Devolve `dueDate` (texto `AAAA-MM-DD`) e `completed`; o cliente calcula atrasado como `dueDate` definido **e** `dueDate` < hoje local **e** não concluído (RN-32). "Hoje" é montado da data local do navegador (`getFullYear/getMonth/getDate`) e comparado como texto ISO, nunca via conversão de fuso. O cálculo é refeito a cada renderização e a cada refresh, o que cobre CA-80 e CB-36.

**Restrição RT-17 (progresso).** O back-end devolve `done` e `total` por card. O cliente calcula o percentual com `Math.round(done / total * 100)` (metades arredondam para cima), e **não exibe** progresso quando `total` é 0 (RN-20, CB-24).

**Restrição RT-18 (atualização).** Sem tempo real (fora de escopo). O quadro é recarregado ao voltar o foco para a aba e após qualquer erro `404`/`409` de concorrência. Se o quadro retorna `404`, o usuário é levado à lista de quadros com mensagem (CB-13, CB-21).

**Restrição RT-19 (arrastar e soltar).** Mover cards e listas por arrastar usa `@dnd-kit` e **também** oferece um controle não-arrastável equivalente (escolher lista de destino e posição), acessível por teclado. O arrastar aplica a mudança de forma otimista e **desfaz** a mudança, com aviso, se a API falhar (CB-06). Demais ações aguardam a resposta antes de alterar a tela.

**Restrição RT-20 (envio único).** Todo botão de envio fica desabilitado enquanto a requisição está em andamento, para impedir duplicação por duplo clique (CB-26). Em caso de erro de validação, os campos preenchidos são preservados e o erro aparece junto ao campo (CA-03, CB-03).

**Restrição RT-21 (texto).** Todo texto do usuário é exibido como texto, nunca como HTML. É proibido `dangerouslySetInnerHTML` (CB-04). Quebras de linha na descrição e nos comentários são preservadas visualmente por estilo, não por marcação injetada.

**Restrição RT-22 (interface por papel).** Controles de ações que o papel não pode executar **não são renderizados** (CA-17, CA-27, CA-36, CA-53, CA-68). A decisão usa `permissions.ts`, mas a API continua sendo a barreira. Um `403` inesperado mostra mensagem de falta de permissão e recarrega o quadro (o papel pode ter mudado, CB-12).

**Restrição RT-23 (fidelidade ao protótipo).** Layout, componentes e tokens visuais são extraídos do `protoripo.pen` via MCP do Pencil durante a implementação. Cada tela inclui os estados que a especificação exige: quadro sem listas (CB-14), lista sem cards (CB-15), card sem seções (CB-22), lista de quadros vazia (RF-06), sem etiquetas (CB-35).

## 3. Modelo de dados

PostgreSQL com TypeORM. Chaves primárias `uuid`. Datas e horas em `timestamptz` (gerados pelo banco). Textos em `varchar(n)` com o mesmo limite da especificação, como defesa em profundidade além da validação da API.

### 3.1 Entidades

| Tabela | Colunas | Restrições |
|---|---|---|
| `users` | `id`, `name` varchar(80), `email` varchar(254), `password_hash` text, `created_at` | `email` **único**, guardado já em minúsculas e sem espaços (RN-01). |
| `sessions` | `id`, `user_id`, `token_hash` char(64), `expires_at`, `created_at` | FK `users` com cascata. `token_hash` único. Índices em `user_id` e `expires_at`. |
| `boards` | `id`, `name` varchar(100), `created_at`, `updated_at` | |
| `board_members` | `board_id`, `user_id`, `role` enum(`admin`,`member`,`viewer`), `created_at` | **PK composta** (`board_id`, `user_id`) garante um papel por pessoa (RN-22). FKs com cascata. Índice em `user_id`. |
| `lists` | `id`, `board_id`, `name` varchar(100), `position` int | FK `boards` com cascata. Índice (`board_id`, `position`). |
| `cards` | `id`, `list_id`, `board_id`, `title` varchar(200), `description` varchar(5000) nulo, `position` int, `completed` boolean padrão falso, `due_date` **date** nulo, `created_at`, `updated_at` | FKs `lists` e `boards` com cascata. Índices (`list_id`, `position`) e `board_id`. |
| `checklists` | `id`, `card_id`, `title` varchar(200), `created_at` | FK `cards` com cascata. |
| `checklist_items` | `id`, `checklist_id`, `text` varchar(200), `done` boolean padrão falso, `created_at` | FK `checklists` com cascata. |
| `labels` | `id`, `board_id`, `name` varchar(30), `name_key` varchar(30), `color` enum, `created_at` | FK `boards` com cascata. **Único** (`board_id`, `name_key`), com `name_key` = nome em minúsculas (RN-26, CA-59). |
| `card_labels` | `card_id`, `label_id` | PK composta. FKs com cascata. Índice em `label_id`. |
| `card_assignees` | `card_id`, `board_id`, `user_id` | PK (`card_id`, `user_id`). FK `cards` com cascata. **FK composta** (`board_id`, `user_id`) → `board_members` com cascata. |
| `comments` | `id`, `card_id`, `author_id`, `text` varchar(2000), `created_at` | FK `cards` com cascata. FK `users` **sem** cascata (a autoria permanece, RN-24). Índice (`card_id`, `created_at`, `id`). |

### 3.2 Restrições sobre o modelo

- **Restrição RT-24 (cascata).** A exclusão de um quadro, lista ou card apaga o que lhe pertence **pelas FKs do banco**, sem o serviço percorrer filhos (RN-15, RN-17, CA-15, CA-24, CA-35). Cascata inclui `card_labels` e `card_assignees`, mas **não** apaga as `labels` ao excluir um card.
- **Restrição RT-25 (atribuições).** A FK composta de `card_assignees` para `board_members` garante no banco que só membros do quadro são responsáveis (RN-23, CA-55) e que remover o membro remove as atribuições (RN-24, CA-50, CA-57). Os comentários **não** dependem de `board_members`, então permanecem (CB-32).
- **Restrição RT-26 (coerência de quadro).** O `board_id` de um card deve ser igual ao da sua lista, e etiqueta e responsável aplicados a um card devem ser do mesmo quadro. O banco não impõe isso por completo, então **os serviços verificam** em toda movimentação e associação (RN-14, RN-26, CB-18).
- **Restrição RT-27 (prazo).** `due_date` é do tipo `date`, sem horário e sem fuso, e trafega como texto `AAAA-MM-DD`, nunca como `Date` com horário. A API só aceita datas válidas do calendário (ano de 0001 a 9999, 29 de fevereiro apenas em ano bissexto), caso contrário `400` (CA-82, CB-37, CB-38).
- **Restrição RT-28 (ordenação determinística).** Listagens ordenam sempre explicitamente: quadros por `created_at` decrescente, `id` como desempate (RN-18); listas e cards por `position`; checklists e itens por (`created_at`, `id`); comentários por (`created_at`, `id`) crescente (RN-30), de forma que todos os membros vejam a mesma sequência (CA-70).
- **Restrição RT-29 (e-mail normalizado).** O e-mail é normalizado (remoção de espaços e minúsculas) **antes** de qualquer comparação ou gravação, em cadastro, login e convite (RN-01, CA-02, CB-27).
- **Restrição RT-30 (paleta).** Cores de etiqueta são um conjunto fixo, o mesmo no banco (enum), na validação da API e na interface: `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `gray`. Cor fora da lista é `400` (CA-60).
- **Restrição RT-31 (sincronização do esquema).** O `DataSource` existente usa `synchronize: true`. Isto é aceito **apenas em desenvolvimento**. O plano não adota migrações nesta fase; se o sistema for para produção, `synchronize` deve ser desligado e migrações introduzidas.
- **Restrição RT-32 (persistência do banco).** O `docker-compose.yml` não declara volume e os dados somem ao recriar o contêiner. Deve receber um volume nomeado no diretório de dados da imagem usada. Se a imagem `bitnami/postgresql:latest` não puder mais ser baixada, trocar por `postgres` oficial mantendo as mesmas variáveis `POSTGRES_*` e ajustando o caminho do volume.

## 4. Interfaces

### 4.1 Convenções da API

- **Formato.** JSON (`Content-Type: application/json`), prefixo `/api`. Datas e horas em ISO 8601 UTC. Prazos em `AAAA-MM-DD`.
- **Autenticação.** Cookie `session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` de 7 dias, `Secure` fora do desenvolvimento. O valor é um token aleatório de 32 bytes em base64url; só o hash SHA-256 é guardado.
- **Códigos.** `200` leitura e alteração (com o recurso), `201` criação (com o recurso), `204` exclusão e ações sem corpo.
- **Formato de erro** (único para todo o sistema):

  | Campo | Conteúdo |
  |---|---|
  | `error.code` | Código estável em `SCREAMING_SNAKE_CASE`. A interface decide comportamento por ele. |
  | `error.message` | Mensagem em português, segura para exibir. |
  | `error.fields` | Opcional, só em `VALIDATION_ERROR`: lista de `{ field, message }`. |

- **Catálogo de erros.**

  | HTTP | Código | Quando |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Entrada inválida: campo vazio, acima do limite, formato, data, cor, posição (CB-01 a CB-03, CB-28). |
  | 401 | `UNAUTHENTICATED` | Sem sessão, sessão inválida ou expirada (CA-07, CB-05). |
  | 401 | `INVALID_CREDENTIALS` | Login falho, **mesma** resposta para e-mail inexistente e senha errada (CA-05). |
  | 403 | `FORBIDDEN` | Membro sem permissão para a ação (RN-07). |
  | 403 | `ORIGIN_NOT_ALLOWED` | Origem não permitida em requisição que altera dados. |
  | 404 | `NOT_FOUND` | Recurso inexistente, ou de quadro do qual o usuário não é membro, ou identificador mal formado. |
  | 404 | `USER_NOT_FOUND` | Convite para e-mail sem conta (CA-47). |
  | 409 | `EMAIL_IN_USE` | Cadastro com e-mail existente (CA-02). |
  | 409 | `ALREADY_MEMBER` | Convite para quem já é membro (CA-48, CB-29). |
  | 409 | `LAST_ADMIN` | Ação que deixaria o quadro sem administrador (CA-51). |
  | 409 | `LABEL_NAME_IN_USE` | Nome de etiqueta já usado no quadro (CA-59). |
  | 409 | `LIST_NOT_EMPTY` | Excluir lista com cards sem informar a escolha (RN-16). Inclui `cardCount`. |
  | 409 | `TARGET_LIST_INVALID` | Lista de destino inexistente, igual à excluída, ou de outro quadro (CB-18, CB-20). |
  | 429 | `TOO_MANY_REQUESTS` | Limite de requisições excedido. |
  | 500 | `INTERNAL_ERROR` | Falha inesperada, sem detalhes internos na resposta. |

### 4.2 Endpoints

Os papéis indicam o **mínimo** exigido: **A** = Administrador, **M** = Administrador ou Membro, **V** = qualquer membro (inclui Observador), **—** = sem exigência de papel.

**Autenticação**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `POST /api/auth/register` | — | `{ name, email, password }` → `201 { user }` e cria a sessão (RF-01) |
| `POST /api/auth/login` | — | `{ email, password }` → `200 { user }` e cria a sessão (RF-02) |
| `POST /api/auth/logout` | autenticado | `204`, apaga a sessão no banco e limpa o cookie (RF-04) |
| `GET /api/auth/me` | autenticado | `200 { user }` ou `401` (RF-03, RF-05) |

`user` = `{ id, name, email }`. A senha e o hash **nunca** aparecem em nenhuma resposta (RN-03).

**Quadros e membros**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `GET /api/boards` | autenticado | `200 [{ id, name, role, createdAt }]` só dos quadros do usuário (RF-06) |
| `POST /api/boards` | autenticado | `{ name }` → `201`, criador vira `admin` (RF-07) |
| `GET /api/boards/:boardId` | V | `200` quadro completo, ver 4.3 (RF-10) |
| `PATCH /api/boards/:boardId` | A | `{ name }` → `200` (RF-08) |
| `DELETE /api/boards/:boardId` | A | `204` (RF-09) |
| `POST /api/boards/:boardId/members` | A | `{ email, role }` → `201 { userId, name, role }` (RF-25) |
| `PATCH /api/boards/:boardId/members/:userId` | A | `{ role }` → `200` (RF-26) |
| `DELETE /api/boards/:boardId/members/:userId` | A, ou V quando `:userId` é o próprio usuário | `204`. Cobre remover (RF-26) e sair (RF-28). Respeita `LAST_ADMIN`. |

A lista de membros vem no quadro completo (RF-27). O convite não cria estado pendente (RN-21).

**Listas**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `POST /api/boards/:boardId/lists` | M | `{ name }` → `201`, vai para o fim (RF-11) |
| `PATCH /api/lists/:listId` | M | `{ name }` → `200` (RF-12) |
| `POST /api/lists/:listId/move` | M | `{ position }` → `200 { listIds }` na nova ordem (RF-13) |
| `DELETE /api/lists/:listId` | M | Consulta opcional `strategy=delete` ou `strategy=move&targetListId=<id>` (RF-14) |

Regras do `DELETE` de lista: lista vazia exclui direto. Lista com cards **sem** `strategy` retorna `409 LIST_NOT_EMPTY` com `cardCount`, e nada é alterado. Com `strategy=move`, os cards vão ao fim da lista de destino na mesma ordem relativa, e a resposta é `200 { movedCount }`. Com `strategy=delete`, a lista e os cards são excluídos (`204`). O servidor exige a escolha explícita; a confirmação e o diálogo ficam na interface (CA-22 a CA-26). Na última lista do quadro, `strategy=move` é inválido (`TARGET_LIST_INVALID`).

**Cards**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `POST /api/lists/:listId/cards` | M | `{ title, description? }` → `201`, vai para o fim (RF-15) |
| `GET /api/cards/:cardId` | V | `200` detalhes, ver 4.3 (RF-19, RF-34) |
| `PATCH /api/cards/:cardId` | M | Qualquer subconjunto de `{ title, description, completed, dueDate }`, com `description` e `dueDate` aceitando `null`. Exige ao menos um campo. `200` (RF-16, RF-20, RF-35) |
| `POST /api/cards/:cardId/move` | M | `{ listId, position }` → `200 { affected: [{ listId, cardIds }] }` com a ordem final das listas afetadas (RF-18) |
| `DELETE /api/cards/:cardId` | M | `204` (RF-17) |
| `PUT /api/cards/:cardId/assignees/:userId` | M | `204`, idempotente (RF-29) |
| `DELETE /api/cards/:cardId/assignees/:userId` | M | `204`, idempotente |
| `PUT /api/cards/:cardId/labels/:labelId` | M | `204`, idempotente (RF-31) |
| `DELETE /api/cards/:cardId/labels/:labelId` | M | `204`, idempotente |

**Checklists**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `POST /api/cards/:cardId/checklists` | M | `{ title }` → `201 { checklist, progress }` (RF-21) |
| `PATCH /api/checklists/:checklistId` | M | `{ title }` → `200` (RF-23) |
| `DELETE /api/checklists/:checklistId` | M | `200 { progress }` (RF-23) |
| `POST /api/checklists/:checklistId/items` | M | `{ text }` → `201 { item, progress }` (RF-22) |
| `PATCH /api/checklist-items/:itemId` | M | `{ text?, done? }` → `200 { item, progress }` (RF-22) |
| `DELETE /api/checklist-items/:itemId` | M | `200 { progress }` (RF-22) |

`progress` = `{ done, total }` do **card inteiro** após a mudança, para a interface atualizar o card imediatamente (RF-24, CA-39 a CA-43). Marcar um item em estado já igual ao pedido é sucesso (CB-25).

**Etiquetas**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `POST /api/boards/:boardId/labels` | M | `{ name, color }` → `201` (RF-30) |
| `PATCH /api/labels/:labelId` | M | `{ name?, color? }` → `200` (RF-30) |
| `DELETE /api/labels/:labelId` | M | `204`, remove dos cards pela cascata (CA-63) |

As etiquetas do quadro vêm no quadro completo.

**Comentários**

| Método e rota | Papel | Corpo → resposta |
|---|---|---|
| `POST /api/cards/:cardId/comments` | M | `{ text }` → `201 { id, text, createdAt, author }` (RF-33) |

Não existem rotas para editar nem excluir comentário (RN-29, CA-73). O histórico vem nos detalhes do card.

### 4.3 Formato dos payloads de leitura

**Quadro completo** (`GET /api/boards/:boardId`). Uma única resposta carrega tudo o que a tela do quadro precisa.

| Campo | Conteúdo |
|---|---|
| `board` | `{ id, name, myRole, createdAt }` |
| `members` | `[{ userId, name, role }]` (sem e-mail: a especificação só prevê nome e papel, RF-27) |
| `labels` | `[{ id, name, color }]` |
| `lists` | `[{ id, name, position, cards }]`, ordenadas por posição |
| `cards[]` | `{ id, listId, title, position, completed, dueDate, labelIds, assigneeIds, progress: { done, total }, commentCount, hasDescription }`, ordenados por posição |

**Detalhes do card** (`GET /api/cards/:cardId`): os campos do card acima, mais `description`, `checklists: [{ id, title, items: [{ id, text, done }] }]` e `comments: [{ id, text, createdAt, author: { id, name } }]`, na ordem da RT-28.

### 4.4 Restrições sobre as interfaces

- **Restrição RT-33 (validação).** Todo corpo, parâmetro de rota e parâmetro de consulta é validado por schema `zod` **antes** de chegar ao serviço. Textos são aparados antes da validação e a contagem de caracteres usa **pontos de código Unicode** (um emoji conta como 1), de modo idêntico no cliente e no servidor, com os mesmos limites do `lib/constants.ts` e de `shared/validation.ts` (RN-02, RN-11, RN-19, RN-26, RN-29). Campos desconhecidos no corpo são descartados. Texto acima do limite é recusado, nunca truncado (CB-02).
- **Restrição RT-34 (sem N+1).** O quadro completo é obtido com um número **fixo** de consultas, independente da quantidade de listas e cards (no máximo 6): quadro e papel, membros, etiquetas, listas, cards com contagens agregadas de checklist e comentários, e vínculos de etiquetas e responsáveis em lote.
- **Restrição RT-35 (contrato de erro).** A interface decide comportamento por `error.code`, nunca por texto de mensagem. Erros de validação mostram `error.fields` junto aos campos. `401`, `404` de quadro e `403` tratados de forma global (RT-13, RT-18, RT-22).
- **Restrição RT-36 (idempotência).** `PUT`/`DELETE` de associações (responsável, etiqueta) são idempotentes: repetir não gera erro nem duplicata.
- **Restrição RT-37 (isolamento de dados na resposta).** Nenhuma resposta traz dados de quadros dos quais o usuário não é membro, nem e-mails de outros membros, nem hashes, tokens ou detalhes internos de erro.

## 5. Requisitos não funcionais

### 5.1 Volume de referência

Os alvos abaixo valem para este volume por quadro: até **50 listas**, **1.000 cards**, **50 membros**, **200 etiquetas**, **500 comentários por card**. Um usuário participa de até algumas dezenas de quadros. O sistema atende dezenas de usuários simultâneos. Acima disso, o comportamento é aceitável mas não garantido.

### 5.2 Desempenho

- **RNF-01.** Carga do quadro completo: **p95 ≤ 300 ms** no servidor (API + banco, rede local) com o volume de referência, atendendo à RT-34.
- **RNF-02.** Demais operações de leitura e escrita: **p95 ≤ 200 ms** no servidor.
- **RNF-03.** Operações de ordenação (mover card ou lista, excluir lista com migração) concluem em uma transação curta, que renumera apenas os irmãos afetados.
- **RNF-04.** Os índices da seção 3.1 são obrigatórios. Toda consulta por quadro, lista, card ou usuário usa um índice.
- **RNF-05.** A interface exibe retorno visual imediato (indicador de carregamento ou atualização otimista do arrastar) e **não bloqueia** a navegação enquanto uma requisição está em curso.
- **RNF-06.** Comentários são devolvidos por inteiro nos detalhes do card. Paginação é uma evolução futura, fora do volume de referência.

### 5.3 Segurança

- **Restrição RT-38 (senhas).** Hash com `scrypt` (custo mínimo N=2^15, r=8, p=1), salt aleatório de 16 bytes por senha, formato autodescritivo com os parâmetros, comparação em tempo constante. Quando o e-mail do login não existe, ainda assim executa-se uma verificação contra um hash fictício, para que o tempo de resposta não revele a existência da conta (RN-05, CA-05). Senhas e tokens nunca são registrados em log.
- **Restrição RT-39 (sessão).** Validade de **7 dias fixos a partir do login**, sem renovação deslizante (RN-04, CA-06, CA-07). Logout apaga a linha da sessão (efeito imediato, CA-08). Sessões expiradas são recusadas na leitura e removidas por limpeza periódica. O cookie nunca é acessível a JavaScript.
- **Restrição RT-40 (CORS e CSRF).**
  - CORS aceita somente a origem configurada em `FRONTEND_URL`, com credenciais.
  - Toda requisição `POST`, `PUT`, `PATCH` ou `DELETE` que traga o cabeçalho `Origin` fora da lista permitida é recusada com `ORIGIN_NOT_ALLOWED`.
  - Corpos exigem `Content-Type: application/json`.
  - Isso, somado a `SameSite=Lax`, é a defesa contra CSRF. Porta diferente no mesmo host é *same-site*, por isso a verificação de `Origin` é obrigatória.
- **Restrição RT-41 (limite de tentativas).** `express-rate-limit` em `/api/auth/login` e `/api/auth/register` (padrão: 10 tentativas por 15 minutos por IP) e um limite geral mais folgado na API. Os valores vêm de variáveis de ambiente. Convite por e-mail revela se uma conta existe (inevitável por CA-47), por isso é restrito ao Administrador e sujeito ao limite geral.
- **Restrição RT-42 (injeção e XSS).** Todo acesso ao banco usa parâmetros do TypeORM; é proibido montar SQL por concatenação de texto do usuário. A interface escapa conteúdo por padrão (RT-21). `helmet` ativo.
- **Restrição RT-43 (limites de entrada).** Corpo JSON limitado a 100 KB. Além dos limites da especificação, o plano fixa **senha com no máximo 128 caracteres** e **e-mail com no máximo 254**, para evitar custo abusivo de hash e entradas inválidas (ver seção 8).
- **Restrição RT-44 (configuração).** Segredos e endereços vêm de variáveis de ambiente validadas na inicialização (falha rápida se faltar algo). Novas variáveis do back-end: `FRONTEND_URL` (padrão de desenvolvimento `http://localhost:3000`), `SESSION_TTL_DAYS` (7), `AUTH_RATE_LIMIT_MAX` e `AUTH_RATE_LIMIT_WINDOW_MIN`. O arquivo `.env` não vai para o repositório.
- **Restrição RT-45 (erros).** Falhas inesperadas retornam `INTERNAL_ERROR` genérico. Detalhes e pilha só no log do servidor. Um tratador de erros global converte `AppError` e erros do `zod` ao formato da seção 4.1.

### 5.4 Escalabilidade e operação

- **RNF-07.** O processo da API não guarda estado em memória entre requisições (a sessão está no banco). Várias instâncias podem rodar atrás de um balanceador sem alteração.
- **RNF-08.** O gargalo previsto é o banco. O bloqueio por quadro (RT-07) serializa apenas operações do **mesmo** quadro, e quadros distintos não se bloqueiam. Ajustar o *pool* de conexões do `pg` conforme o número de instâncias.
- **RNF-09.** Caminho de evolução, fora do escopo atual e sem exigir mudar o contrato: paginação de comentários, atualização em tempo real, cache de leitura do quadro, migrações versionadas.
- **RNF-10.** Em produção, front-end e API devem estar no **mesmo site** (domínio registrável), para o cookie `SameSite=Lax` ser enviado. Caso contrário, a alternativa é o Next.js reescrever `/api/*` para a API, o que torna a origem única; essa troca não afeta os contratos.

### 5.5 Manutenibilidade e verificação

- **RNF-11.** Mudar uma permissão exige alterar um único lugar no back-end (`policy.ts`) e o espelho `permissions.ts` no front-end.
- **RNF-12.** Os limites de texto e a paleta existem uma vez por projeto (`shared/validation.ts` e `lib/constants.ts`) e são idênticos.
- **RNF-13.** Verificação feita pelo agente: `npx tsc --noEmit`/`npm run build` no back-end e `npm run build` no front-end, sem erros de tipo nem de importação (`context.md`, regra 3). A conferência funcional é por inspeção, usando a tabela de rastreabilidade da seção 7. Esta fase não prevê testes automatizados executados pelo agente.

## 6. Resumo das restrições obrigatórias

| Tema | Restrições |
|---|---|
| Dependências e versões | RT-01, RT-02 |
| Fronteiras e autorização | RT-03, RT-04, RT-05, RT-06 |
| Concorrência e ordem | RT-07, RT-08, RT-09, RT-10, RT-11 |
| Dados e integridade | RT-24 a RT-32 |
| Contratos | RT-33 a RT-37 |
| Segurança | RT-38 a RT-45 |
| Interface | RT-12 a RT-23 |

## 7. Rastreabilidade: especificação para plano

| Área da especificação | Onde o plano cobre |
|---|---|
| Cadastro, login, sessão persistente, logout, rota protegida (RF-01 a RF-05, CA-01 a CA-09, RN-01 a RN-05) | Módulo `auth`, tabelas `users` e `sessions`, RT-13, RT-29, RT-38, RT-39, RT-40, RT-41 |
| Quadros (RF-06 a RF-10, CA-10 a CA-17) | Módulo `boards`, `board_members`, RT-06, RT-24, `GET /api/boards*` |
| Listas e exclusão com cards (RF-11 a RF-14, CA-18 a CA-27) | Módulo `lists`, RT-07, RT-09, regras do `DELETE` de lista, `LIST_NOT_EMPTY`, `TARGET_LIST_INVALID` |
| Cards e movimentação (RF-15 a RF-20, CA-28 a CA-37) | Módulo `cards`, RT-09, RT-26, RT-19, endpoint `move` |
| Checklists e progresso (RF-21 a RF-24, CA-38 a CA-45) | Módulo `checklists`, `progress` nas respostas, RT-17 |
| Membros, papéis e atribuição (RF-25 a RF-29, CA-46 a CA-57, RN-06 a RN-10, RN-21 a RN-25) | Módulo `members`, `policy.ts`, RT-07, RT-25, `LAST_ADMIN`, `ALREADY_MEMBER` |
| Etiquetas e filtro (RF-30 a RF-32, CA-58 a CA-68, RN-26 a RN-28) | Módulo `labels`, `labels` e `card_labels`, RT-15, RT-30, `LABEL_NAME_IN_USE` |
| Comentários (RF-33, RF-34, CA-69 a CA-73, RN-29, RN-30) | Módulo `comments`, RT-28, sem rotas de edição ou exclusão |
| Prazos e atraso (RF-35 a RF-37, CA-74 a CA-82, RN-31 a RN-33) | Coluna `date`, RT-16, RT-27, filtro no cliente (RT-15) |
| Casos de borda gerais e de concorrência (CB-01 a CB-38) | RT-07, RT-08, RT-10, RT-18, RT-20, RT-33, RT-35, RT-45 |

## 8. Lacunas da especificação resolvidas neste plano e riscos

**Lacunas.** A especificação não definia os pontos abaixo. O plano fixou uma decisão e eles devem ser aprovados ou revistos:

1. **Tamanho máximo da senha (128) e do e-mail (254).** RN-02 só prevê o mínimo da senha. O limite superior protege contra abuso do hash (RT-43).
2. **Cores de etiqueta.** RN-26 fala em "conjunto fixo" sem enumerar. O plano define oito cores (RT-30).
3. **Visibilidade do e-mail dos membros.** Não exposto aos demais membros, seguindo RF-27 (nome e papel).
4. **Mensagem de login.** O texto exato fica livre, desde que idêntico para e-mail inexistente e senha incorreta.

**Riscos.**

| Risco | Efeito | Mitigação |
|---|---|---|
| TypeORM 1.x e Next 16 diferem do que é conhecido | Erros de API em tempo de compilação | RT-02: conferir tipos e documentação instalados; `tsc` e `build` revelam o resto |
| Imagem `bitnami/postgresql:latest` pode não estar mais disponível | O banco não sobe | RT-32: trocar por `postgres` oficial |
| `synchronize: true` altera o esquema automaticamente | Perda de dados ao mudar entidades em ambiente não descartável | RT-31: só em desenvolvimento |
| Bloqueio por quadro serializa escritas do mesmo quadro | Latência em quadros muito concorridos | Aceitável no volume de referência (RNF-08) |
| Cookie `SameSite=Lax` com front e API em sites distintos | Sessão não é enviada | RNF-10 |

## 9. Fatiamento sugerido para as próximas fases

Cada fatia entrega back-end e front-end completos (`context.md`, regra 1), nesta ordem, porque cada uma depende da anterior:

1. **Fundação**: `env`, `app.ts`, erros, validação, `policy.ts`, `board-access.ts`, `ordering.ts`, instância axios, `proxy.ts`, layout, componentes de interface básicos, volume do compose.
2. **Autenticação**: cadastro, login, `me`, logout, sessão, páginas `/login` e `/register`.
3. **Quadros e membros**: CRUD de quadros, lista de quadros, convite e gestão de membros, saída do quadro.
4. **Listas e cards**: CRUD e ordenação de listas, exclusão com escolha, CRUD e movimentação de cards, arrastar e soltar, marcação de concluído.
5. **Checklists**: checklists, itens e progresso.
6. **Etiquetas e atribuição**: CRUD de etiquetas, aplicação em cards, filtro, responsáveis.
7. **Comentários e prazos**: comentários e histórico, prazo, indicação de atraso e filtro de atrasados.
