# Tarefas de Implementação

Fase 3 (Implement). **Estado final: T00 a T12 concluídas.** Quebra de `docs/plan.md` (seção 9, fatiamento) em tarefas discretas e revisáveis. Cada tarefa entrega back-end **e** front-end (`context.md`, regra 1) e termina com verificação por `tsc` e `npm run build` (`context.md`, regra 3).

**Legenda de estado:** `[ ]` pendente · `[~]` em andamento · `[x]` concluída

**Convenção de testes.** Testes unitários (Vitest) codificam regras da especificação como asserções sobre **lógica pura** (validação, permissões, ordenação, hash, progresso, atraso). Serviços que dependem do banco ficam finos; a regra decisória é extraída para funções puras testáveis. Pelas regras do `context.md`, os testes são escritos e verificados por tipos (`tsc -p tsconfig.test.json`), mas **não são executados** pelo agente.

---

## T00 — Fundação do back-end

**Estado:** `[x]`
**Cobre:** RT-01, RT-03, RT-04, RT-06 a RT-09, RT-33, RT-43 a RT-45 · RN-02, RN-07, RN-11, RN-13, RN-19, RN-26, RN-29, RN-31 · CB-01 a CB-03, CB-16, CB-17, CB-37, CB-38
**Entrega (back-end):**

- Dependências: `zod`, `helmet`, `express-rate-limit`, `cookie-parser`, `@types/cookie-parser`, `vitest`.
- `config/env.ts`, `app.ts`, `main.ts` reorganizado, variáveis novas no `.env`.
- `shared/errors.ts` (catálogo de erros), `shared/http.ts` (autenticação, verificação de Origin, tratador de erros), `shared/validation.ts` (limites, contagem por pontos de código, datas), `shared/policy.ts` (matriz RN-07), `shared/ordering.ts` (posição densa), `shared/board-access.ts`.
- `docker-compose.yml` com volume (RT-32).
- `tsconfig.test.json` e script `test`.
  **Testes unitários:** limites de texto e contagem por pontos de código; datas válidas e inválidas; matriz de permissões; inserir, mover e remover em ordem densa.
  **Pronto quando:** `tsc` e `npm run build` limpos.

## T01 — Fundação do front-end

**Estado:** `[x]`
**Cobre:** RT-02, RT-12, RT-13, RT-16, RT-17, RT-20, RT-21, RT-22, RT-23 · RN-20, RN-32
**Entrega (front-end):**

- Dependências: `@dnd-kit/*`, `vitest`.
- Leitura do protótipo `protoripo.pen` pelo MCP do Pencil e extração dos tokens visuais.
- `lib/api.ts`, `lib/types.ts`, `lib/constants.ts`, `lib/permissions.ts`, `lib/date.ts`, `lib/progress.ts`, `lib/redirect.ts`.
- `proxy.ts`, `app/layout.tsx` (pt-BR), `globals.css` com tokens, componentes `ui/` (botão, campo, diálogo, confirmação, toast, estado vazio).
  **Testes unitários:** "hoje" local e atraso; progresso e arredondamento; sanitização do parâmetro `next`; espelho da matriz de permissões.
  **Pronto quando:** `npm run build` e `tsc` limpos.

## T02 — Autenticação

**Estado:** `[x]`
**Cobre:** RF-01 a RF-05 · CA-01 a CA-09 · RN-01 a RN-05 · CB-05
**Entrega:**

- Back-end: entidades `User` e `Session`; módulo `auth` (registro, login, `me`, logout); hash `scrypt`; sessão de 7 dias; limitador de tentativas; limpeza de sessões expiradas.
- Front-end: contexto de usuário; páginas `/login` e `/register` com erros por campo; redirecionamento por `next`; logout; tratamento global de `401`.
  **Testes unitários:** hash e verificação de senha; schemas de cadastro e login (e-mail, nome, senha); normalização de e-mail; expiração de sessão e hash de token.
  **Pronto quando:** `tsc` e `build` limpos.

## T03 — Quadros

**Estado:** `[x]`
**Cobre:** RF-06 a RF-10 · CA-10 a CA-17 · RN-06, RN-10, RN-12, RN-15, RN-18 · CB-07, CB-21
**Entrega:**

- Back-end: entidades `Board`, `BoardMember`; módulo `boards` (listar, criar, renomear, excluir, quadro completo com um número fixo de consultas).
- Front-end: página de quadros (lista, estado vazio, criar, renomear, excluir com confirmação); página do quadro (esqueleto com cabeçalho, estados vazios, recarga ao voltar o foco, tratamento de `404`).
  **Testes unitários:** schema de nome de quadro; decisão 404 versus 403 (não membro versus papel insuficiente).
  **Pronto quando:** `tsc` e `build` limpos.

## T04 — Membros e papéis

**Estado:** `[x]`
**Cobre:** RF-25 a RF-28 · CA-46 a CA-53, CA-57 · RN-06, RN-09, RN-21, RN-22 · CB-12, CB-13, CB-27 a CB-32
**Entrega:**

- Back-end: módulo `members` (convidar por e-mail, alterar papel, remover, sair) com bloqueio por quadro e regra do último administrador.
- Front-end: painel de membros (lista com papéis, convite, troca de papel, remoção, sair do quadro).
  **Testes unitários:** regra do último administrador (rebaixar, remover, sair; com um e com dois administradores); schema de convite.
  **Pronto quando:** `tsc` e `build` limpos.

## T05 — Listas

**Estado:** `[x]`
**Cobre:** RF-11 a RF-14 · CA-18 a CA-27 · RN-13, RN-16 · CB-09, CB-14, CB-15, CB-19, CB-20
**Entrega:**

- Back-end: entidade `List`; módulo `lists` (criar, renomear, mover, excluir com `strategy`); `LIST_NOT_EMPTY` e `TARGET_LIST_INVALID`.
- Front-end: colunas no quadro, criar, renomear, reordenar (arrastar e controle equivalente), diálogo de exclusão com as duas opções e contagem de cards.
  **Testes unitários:** escolha da estratégia de exclusão (vazia, com cards sem escolha, mover, excluir, última lista); ordem ao mover cards ao fim de outra lista.
  **Pronto quando:** `tsc` e `build` limpos.
  **Notas:** exclusão de lista com cards oferece mover ou excluir; com uma única lista, a opção de mover não é exibida (CA-26).

## T06 — Cards

**Estado:** `[x]`
**Cobre:** RF-15 a RF-20 · CA-28 a CA-37 · RN-11, RN-14, RN-33 · CB-08, CB-16 a CB-18, CB-22
**Entrega:**

- Back-end: entidade `Card`; módulo `cards` (criar, detalhes, editar, concluir, mover, excluir).
- Front-end: cards nas listas; painel de detalhes por `?card=`; edição de título e descrição; marcar concluído; mover por arrastar e por controle equivalente, com desfazer em caso de falha.
  **Testes unitários:** schema de card; movimento entre listas e dentro da mesma lista (CA-31, CA-32, CA-33, CB-16, CB-17).
  **Pronto quando:** `tsc` e `build` limpos.
  **Notas:** o `PATCH /cards/:id` já aceita `completed` e `dueDate`, entregues aqui junto com T11. Com filtro ativo, o arrastar de cards fica desligado (os índices da tela não são as posições reais); o controle "Mover" do card continua disponível.

## T07 — Checklists

**Estado:** `[x]`
**Cobre:** RF-21 a RF-24 · CA-38 a CA-45 · RN-19, RN-20 · CB-24, CB-25
**Entrega:**

- Back-end: entidades `Checklist`, `ChecklistItem`; módulo `checklists` com `progress` em toda resposta; `progress` nos cards do quadro.
- Front-end: seção de checklists no painel do card; barra de progresso no card da lista e nos detalhes.
  **Testes unitários:** progresso `done/total` e percentual (CA-39 a CA-43); schemas de checklist e item.
  **Pronto quando:** `tsc` e `build` limpos.

## T08 — Etiquetas e filtro

**Estado:** `[x]`
**Cobre:** RF-30 a RF-32 · CA-58 a CA-68 · RN-26 a RN-28 · CB-33 a CB-35
**Entrega:**

- Back-end: entidades `Label`, `CardLabel`; módulo `labels` (criar, editar, excluir, aplicar e remover).
- Front-end: gerenciador de etiquetas, aplicação no card, filtro por etiquetas (OU) no quadro, indicação de filtro ativo, mensagem de resultado vazio.
  **Testes unitários:** unicidade por `name_key`; paleta; filtro OU por etiquetas (CA-64); filtro vazio mostra tudo.
  **Pronto quando:** `tsc` e `build` limpos.
  **Notas:** a barra de filtros já inclui o botão "Atrasados" (UI do RF-37, validada em T11).

## T09 — Responsáveis

**Estado:** `[x]`
**Cobre:** RF-29 · CA-54 a CA-56, CA-50 · RN-23, RN-24, RN-25 · CB-32
**Entrega:**

- Back-end: entidade `CardAssignee` com FK composta para `board_members`; atribuir e remover.
- Front-end: seletor de responsáveis no card; avatares na lista e nos detalhes.
  **Testes unitários:** validação de atribuição (só membros do quadro); idempotência.
  **Pronto quando:** `tsc` e `build` limpos.

## T10 — Comentários

**Estado:** `[x]`
**Cobre:** RF-33, RF-34 · CA-69 a CA-73 · RN-29, RN-30 · CB-26
**Entrega:**

- Back-end: entidade `Comment`; criar comentário; histórico nos detalhes do card.
- Front-end: histórico cronológico com autor e data; formulário com envio único; Observador só lê.
  **Testes unitários:** schema de comentário (vazio, só espaços, 2.000 caracteres, emoji); formatação de data e hora.
  **Pronto quando:** `tsc` e `build` limpos.

## T11 — Prazos e atraso

**Estado:** `[x]`
**Cobre:** RF-35 a RF-37 · CA-74 a CA-82 · RN-31 a RN-33 · CB-23, CB-36 a CB-38
**Entrega:**

- Back-end: `dueDate` em `PATCH /cards/:id`, com validação de calendário.
- Front-end: seletor de prazo; indicação visual de atrasado; filtro de atrasados combinado com etiquetas (E entre tipos).
  **Testes unitários:** atrasado (prazo igual a hoje, anterior, concluído, sem prazo, virada do dia); combinação de filtros (CA-81); datas inválidas.
  **Pronto quando:** `tsc` e `build` limpos.
  **Notas:** back-end do prazo entregue em T06; UI do filtro de atrasados entregue em T08. Aqui ficaram o seletor de prazo, a identificação visual e os testes de atraso.

## T12 — Verificação final

**Estado:** `[x]`
**Entrega:**

- `tsc` e `npm run build` limpos nos dois projetos; `tsc -p tsconfig.test.json` limpo nos testes.
- Auditoria de alinhamento com `docs/spec.md` e `docs/plan.md` (tabela de rastreabilidade).
- Atualização final do estado de cada tarefa neste arquivo.

---

## Verificação executada

| Verificação                                                          | Resultado                                                                                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `back-end`: `npx tsc --noEmit` e `npm run build`                     | sem erros                                                                                                                                |
| `back-end`: `npx tsc -p tsconfig.test.json` (tipos dos testes)       | sem erros                                                                                                                                |
| `front-end`: `npx tsc --noEmit` (inclui os testes) e `npm run build` | sem erros                                                                                                                                |
| Testes unitários (Vitest)                                            | escritos: 13 arquivos no back-end e 11 no front-end. **Não executados**, por `context.md` regra 3. Rodar com `npm test` em cada projeto. |
| Execução da aplicação, endpoints e fluxo de API                      | **não executados** (`context.md`, regra 3)                                                                                               |

## Alinhamento com a especificação e o plano

Conferência por inspeção. Cobertura de cada grupo de requisitos:

| Área                   | Spec                                        | Onde está implementado                                                                  |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| Autenticação e sessão  | RF-01 a RF-05, CA-01 a CA-09, RN-01 a RN-05 | `modules/auth`, `lib/auth.tsx`, `proxy.ts`, `LoginForm`, `RegisterForm`                 |
| Quadros                | RF-06 a RF-10, CA-10 a CA-17                | `modules/boards`, `BoardsPage`, `BoardView`                                             |
| Membros                | RF-25 a RF-28, CA-46 a CA-53, CA-57         | `modules/members` (bloqueio do quadro e regra do último administrador), `MembersDialog` |
| Listas                 | RF-11 a RF-14, CA-18 a CA-27                | `modules/lists`, `BoardCanvas`, `ListColumn`, `DeleteListDialog`                        |
| Cards                  | RF-15 a RF-20, CA-28 a CA-37                | `modules/cards`, `CardItem`, `CardDetailDialog`, `CardDetailBody`                       |
| Checklists e progresso | RF-21 a RF-24, CA-38 a CA-45                | `modules/checklists`, `ChecklistSection`, `lib/checklists.ts`, `ProgressBar`            |
| Responsáveis           | RF-29, CA-54 a CA-56                        | `modules/assignees` (FK composta), `CardAssigneesSection`                               |
| Etiquetas e filtro     | RF-30 a RF-32, CA-58 a CA-68                | `modules/labels`, `LabelsDialog`, `CardLabelsSection`, `lib/filters.ts`                 |
| Comentários            | RF-33, RF-34, CA-69 a CA-73                 | `modules/comments`, `CommentsSection` (sem rotas de edição ou exclusão)                 |
| Prazos e atraso        | RF-35 a RF-37, CA-74 a CA-82                | coluna `date`, `DueDateSection`, `DueBadge`, `lib/date.ts`, `lib/filters.ts`            |

## Desvios do plano e decisões tomadas na implementação

1. **Protótipo do Pencil não consultado.** O app do Pencil não estava em execução (o MCP respondeu "failed to connect to running Pencil app"), então a interface foi desenhada com Tailwind e tokens próprios, seguindo apenas a especificação. É preciso abrir o `protoripo.pen` e alinhar o visual (RT-23).
2. **Rotas e controladores juntos.** Cada módulo tem `*.routes.ts` fazendo o papel de controlador fino (validar, chamar o serviço, responder), em vez de um arquivo `*.controller.ts` separado. Regras e acesso ao banco continuam só nos serviços (RT-03).
3. **`proxy.ts` só protege rotas privadas.** Não redireciona quem já tem cookie para fora de `/login`; a própria página de login consulta `/auth/me` e redireciona. Isso evita laço de redirecionamento quando o cookie existe mas a sessão já expirou ou foi revogada.
4. **Senha não sofre `trim`**, ao contrário dos demais textos, porque espaços fazem parte da senha. Limites de 128 (senha) e 254 (e-mail), conforme RT-43.
5. **Quadro completo em 6 consultas** (papel, quadro, membros, etiquetas, listas, cards com agregados por subconsulta), dentro do limite da RT-34.
6. **Dependências.** Back-end: `zod`, `helmet`, `express-rate-limit`, `cookie-parser`, `@types/cookie-parser`, `vitest`. Front-end: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `vitest`. No front-end, `@types/node` foi atualizado de `^20` para `^24` porque o `vitest` exige peer `>=22`.
7. **`docker-compose.yml`** ganhou volume nomeado (RT-32). A imagem `bitnami/postgresql:latest` foi mantida (já existe localmente).
8. **Esquema do banco** criado por `synchronize` em desenvolvimento (RT-31). Nenhuma migração.
