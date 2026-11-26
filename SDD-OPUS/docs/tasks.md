# Tarefas de Implementação

Derivadas de [`spec.md`](./spec.md) e [`plan.md`](./plan.md). Cada tarefa entrega uma fatia funcional (back-end + front-end) e termina com o código compilando (`npx tsc --noEmit` / `npm run build`).

Legenda de estado: `[ ]` pendente · `[~]` em andamento · `[x]` concluída (código escrito e compilando; ver "Limites da verificação")

Restrições de execução do projeto (`context.md`): o agente só executa `tsc` e `npm run build`; **não** executa testes, a aplicação, endpoints nem fluxos de API. Os testes unitários são escritos e checados por tipo (`tsc -p tsconfig.test.json`), mas **não são executados** pelo agente.

---

## T01 — Fundação do back-end
**Entrega:** servidor Express configurável, seguro e com contrato de erro padronizado.
**Spec/plano:** plano §2.2, §4.1–4.2, §5.3–5.5, R-01, R-02, R-14, R-15, R-17, R-21, R-22, R-24.

- Instalar `zod`, `cookie-parser`, `helmet`, `express-rate-limit`, `@types/cookie-parser`, `vitest`.
- `config/env` (validação na partida), `database.ts` (sem `synchronize` em produção, parser de `date` como texto).
- `shared/errors`, `shared/http` (validação zod, tratador de erros, log por requisição, checagem de origem, `Cache-Control: no-store`).
- `shared/limits`, `shared/palette`, `shared/roles`, `shared/dates`, `shared/ids`.
- `app.ts` / `main.ts`, `GET /api/health`.
- **Testes:** limites, paleta, papéis, datas reais, ids, checagem de origem, conversão de erros do zod.

## T02 — Autenticação (back-end)
**Entrega:** cadastro, login, logout e `me` com sessão persistente. *(C1–C5, CA-C1…C9)*
**Plano:** §3.2 `users`/`sessions`, §4.4 Autenticação, §5.1, §5.2, R-18…R-20, R-23.

- Entidades `User`, `Session`.
- Hash de senha com `scrypt`; token de sessão (hash SHA-256); expiração deslizante.
- Middleware `requireAuth`; limite de taxa nas rotas de autenticação.
- Rotas `/api/auth/*`.
- **Testes:** senha, token/sessão, esquemas de cadastro/login.

## T03 — Fundação do front-end e telas de autenticação
**Entrega:** login, cadastro, logout e proteção de rotas. *(C1–C5)*
**Plano:** §1.2, §1.3, §2.1, §2.4, §2.5, R-04, R-06.

- Instalar `@tanstack/react-query`, `@dnd-kit/*`, `vitest`.
- `next.config` (rewrite `/api`), `src/proxy.ts`, `lib/api`, `lib/types`, provider do React Query, layout em pt-BR.
- Páginas `/login`, `/register`; layout autenticado com cabeçalho e logout; redirecionamento em 401.
- **Testes:** destino seguro de redirecionamento (`next`), extração de mensagens de erro.

## T04 — Quadros e membros (back-end)
**Entrega:** CRUD de quadros e gestão de membros com papéis. *(Q1–Q5, M1–M3, CA-Q1…Q7, CA-M1…M7)*
**Plano:** §3.2 `boards`/`board_members`, §4.2 (404 × 403), §4.4 Quadros e Membros, R-18, R-26, R-28.

- Entidades `Board`, `BoardMember`.
- Serviço de acesso (papel por quadro; 404 sem vínculo, 403 com papel insuficiente).
- Serviços e rotas de `boards` e `members`; regra do último Administrador sob bloqueio do quadro.
- **Testes:** matriz de permissões, regra do último Administrador, esquemas.

## T05 — Quadros e membros (front-end)
**Entrega:** lista de quadros, criar/editar/excluir quadro e gerenciar membros. *(Q1–Q5, M1–M3)*

- Página `/boards` (lista, estado vazio, criação).
- Edição e exclusão com confirmação.
- Diálogo de membros (convidar, trocar papel, remover) respeitando papéis.

## T06 — Listas e cards (back-end)
**Entrega:** listas e cards com ordenação consistente e carga do quadro em uma chamada. *(L1–L4, K1–K6, CA-L\*, CA-K\*)*
**Plano:** §3.2 `lists`/`cards`, §3.4, §4.4 Listas e Cards, §6.2, §6.3, R-12, R-13, R-25, R-27, R-32.

- Entidades `List`, `Card`.
- Utilitário de ordenação (puro) e renumeração em lote.
- Serviços e rotas de `lists` e `cards` (com bloqueio por quadro).
- `GET /api/boards/:id` (`BoardDetail`, ≤ 8 consultas).
- **Testes:** ordenação (mover, reordenar, limites, no-op), confirmação de exclusão de lista, esquemas.

## T07 — Quadro (front-end)
**Entrega:** tela do quadro com listas, cards e arrastar e soltar. *(L1–L4, K1–K5)*
**Plano:** §2.4, §6.5, R-34, R-35.

- Página `/boards/[boardId]`: listas, cards, criar/renomear/excluir lista, criar card, mover/reordenar por arrastar (com teclado), diálogo de exclusão de lista com contagem.
- Atualização otimista com *rollback*.
- **Testes:** lógica de movimentação do lado do cliente.

## T08 — Enriquecimento do card (back-end)
**Entrega:** checklists, etiquetas, responsáveis e comentários. *(CK1–CK5, E1–E3, M4, CM1–CM3, CA-CK\*, CA-E\*, CA-M8…M12, CA-CM\*)*
**Plano:** §3.2, §3.3, §4.4, R-16, R-28, R-29.

- Entidades `Checklist`, `ChecklistItem`, `Label`, `CardLabel`, `CardAssignee`, `Comment`.
- Serviços e rotas de `checklists`, `labels`, `assignees` e `comments`; `GET /api/cards/:id`, `PATCH` de card (prazo, conclusão).
- **Testes:** esquemas (limites, cor da paleta, chave de nome), regras de unicidade, normalização.

## T09 — Enriquecimento do card (front-end)
**Entrega:** modal do card, etiquetas e filtro, responsáveis, comentários, prazo e atraso. *(CK, E, M4, CM, P)*
**Plano:** §2.4, R-05, R-29, R-30, R-31.

- Modal do card (`?card=<id>`): título, descrição, conclusão, prazo, checklists com progresso, etiquetas, responsáveis, comentários.
- Gerenciador de etiquetas, filtro local por etiqueta, resumo e destaque de atrasados.
- Progresso e atraso nos cards da lista.
- **Testes:** progresso (RN-D1), atraso (RN-D3), filtro por união (RN-F2), contagem de atrasados.

## T10 — Verificação final
**Entrega:** alinhamento com spec e plano comprovado.

- `npx tsc --noEmit` e `npm run build` em `back-end/` e `front-end/` sem erros; `tsc -p tsconfig.test.json` nos testes.
- Revisão cruzada código × spec × plano (matriz de rastreabilidade).
- Atualização do estado das tarefas neste arquivo.

---

## Estado

| Tarefa | Estado | Observações |
|---|---|---|
| T01 Fundação do back-end | [x] | `tsc` ok. Testes escritos. |
| T02 Autenticação (back-end) | [x] | `tsc` ok. Testes escritos. |
| T03 Fundação do front-end e autenticação | [x] | `npm run build` ok. Testes escritos. |
| T04 Quadros e membros (back-end) | [x] | `tsc` ok. Testes escritos. |
| T05 Quadros e membros (front-end) | [x] | `npm run build` ok. |
| T06 Listas e cards (back-end) | [x] | `tsc` ok. Testes escritos. `GET /boards/:id`, `GET`/`PATCH /cards/:id` ficaram para a T08 (ver notas). |
| T07 Quadro (front-end) | [x] | `npm run build` ok. Testes da lógica de movimentação escritos. |
| T08 Enriquecimento do card (back-end) | [x] | `tsc` ok. Testes escritos. Inclui o carregamento do quadro e do card. |
| T09 Enriquecimento do card (front-end) | [x] | `npm run build` ok. Testes de progresso, atraso e filtro escritos. |
| T10 Verificação final | [x] | Ver abaixo. |

## Notas de execução (desvios do plano de tarefas)

1. **Ordem executada:** T01 → T02 → T03 → T04 → T05 → T06 → **T08** → T07 → T09. A T08 vem antes da T07 porque a tela do quadro precisa de `GET /api/boards/:id`, que depende das tabelas de etiquetas, responsáveis e checklists.
2. **Rotas movidas da T06 para a T08:** `GET /api/boards/:id`, `GET /api/cards/:id` e `PATCH /api/cards/:id` (respondem com dados que cruzam todas as tabelas). A edição de campos do card (`updateCardFields`) nasceu na T06.
3. **Remoção de membro:** a limpeza das atribuições do membro (RN-X6) foi acrescentada à T04 só na T08, quando `card_assignees` passou a existir.
4. **Protótipo Pencil não consultado:** `get_app_state`/`execute` falharam com *"A file needs to be open in the editor"*, pois nenhum arquivo `.pen` estava aberto no Pencil. A interface foi desenhada a partir da especificação e do plano (R-07 não foi cumprida). Para aproximar do protótipo é preciso abrir `protoripo.pen` no Pencil e repetir a consulta.
5. **Dependências instaladas** (R-08): back-end `zod`, `cookie-parser`, `helmet`, `express-rate-limit`, `@types/cookie-parser`, `vitest`; front-end `@tanstack/react-query`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `vitest`. No front, `@types/node` subiu de `^20` para `^24` porque o `vitest` 5 exige `^22 || >=24` (conflito `ERESOLVE`).
6. **Configuração alterada:** `back-end/.env` ganhou `WEB_ORIGIN=http://localhost:3000` (não é segredo). Se o Next rodar em outra porta, esse valor precisa acompanhar, senão toda mutação recebe `403`. O `tsconfig.json` do back-end exclui `*.test.ts` do build; `tsconfig.test.json` os inclui para checagem de tipos.
7. **Fonte:** a fonte do Google (`next/font/google`) foi trocada por pilha de fontes do sistema, para o build não depender de rede.

## T10 — Verificação

**Executado e aprovado**
- `back-end`: `npm run build` (`tsc`) sem erros; `npx tsc -p tsconfig.test.json` sem erros (testes checados por tipo).
- `front-end`: `npm run build` (Next + TypeScript, inclui os testes) sem erros; `npx tsc --noEmit` sem erros.

**Limites da verificação (leia antes de confiar)**
- Os **testes unitários foram escritos e checados por tipo, mas não foram executados**: `context.md` limita o agente a `tsc` e `npm run build`. São 31 arquivos / 209 casos (back-end 25 / 146, front-end 6 / 63). Rodar com `npm test` em cada pacote.
- A **aplicação, os endpoints e os fluxos de API nunca foram executados**. Nada foi testado contra o PostgreSQL: o SQL cru (`persistOrder`, carga do quadro, progresso), as entidades TypeORM e as transações/bloqueios só foram validados pelo compilador.
- Os testes cobrem a **lógica pura** (esquemas de validação, ordenação, regras de papel, último administrador, confirmação de exclusão de lista, sessão e senha, progresso, atraso, filtro, montagem do quadro, movimentação do arrastar). **Não** cobrem serviços com banco, rotas HTTP nem componentes React.

## Alinhamento com a especificação e o plano (revisão estática)

| Área | Onde está | Cobertura de teste |
|---|---|---|
| C1–C5 Conta e sessão | `modules/auth`, `proxy.ts`, `lib/api.ts` (401), páginas `login`/`register` | senha, sessão, esquemas, `safeNext`, `parseApiError` |
| Q1–Q5 Quadros | `modules/boards`, `app/(app)/boards` | esquemas, `assertRole` |
| L1–L4 Listas, RF05 | `modules/lists` (`confirmCards`), `ListColumn` | `decideListDeletion`, `ordering`, esquemas |
| K1–K6 Cards | `modules/cards`, `BoardView`, `CardModal` | `ordering`, `boardOrdering`, esquemas |
| CK1–CK5 Checklists | `modules/checklists`, `ChecklistSection` | esquemas, `progress` |
| M1–M5 Membros | `modules/members`, `assignees`, `MembersDialog` | `wouldLeaveNoAdmin`, esquemas |
| E1–E4 Etiquetas e filtro | `modules/labels`, `FilterBar`, `LabelsManagerDialog` | `labelNameKey`, esquemas, `filters` |
| CM1–CM3 Comentários | `modules/comments` (sem edição/exclusão), `CommentsSection` | esquemas |
| P1–P4 Prazos | `cards.due_date`, `lib/dates`, `CardView`, `FilterBar` | `dates`, `filters` |
| Plano §6.2 (≤ 8 consultas) | `boardDetail.service.ts` | `assembleBoardDetail` |
| Plano §6.3 (bloqueio por quadro) | `shared/boardLock.ts` | — (requer banco) |

**Restrições do plano conferidas por leitura do código:** R-01…R-04 (camadas), R-09…R-13 (modelo e ordenação), R-14…R-17 (contrato e erros), R-18…R-24 (segurança), R-25…R-31 (regras de negócio), R-32 (consultas constantes), R-36 (`tsc`/`build`). **Não conferidas em execução:** R-32 (contagem real de consultas), R-33 (comportamento transacional), R-34 (otimismo do arrastar no navegador).

**Pendências conhecidas**
- Nenhuma tela foi aberta num navegador: a acessibilidade (teclado no arrastar, foco nos diálogos) e o layout em 360 px estão implementados mas não verificados visualmente.
- `npm audit` no front-end acusa uma vulnerabilidade crítica já presente no `next@16.3.4` (RCE em `next/og`; correção em `16.3.8`). Não foi alterada por estar fora do escopo.
