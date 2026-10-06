# Coleta de Dados — Estudo Comparativo de Estratégias de Desenvolvimento Assistidas por IA

**Autor:** Caio Sousa da Rocha · UFC Quixadá · Sistemas de Informação · 2026

## Requisitos funcionais

| ID   | Descrição                                                                                                                                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF01 | Cadastro, autenticação e login de usuários, com manutenção de sessão persistente.                                                                                                 |
| RF02 | Criação, listagem, edição e exclusão de quadros (boards) pertencentes ao usuário autenticado.                                                                                     |
| RF03 | Criação, renomeação, reordenação e exclusão de listas (colunas) dentro de um quadro.                                                                                              |
| RF04 | Criação, edição, exclusão e movimentação de cards entre listas de um mesmo quadro.                                                                                                |
| RF05 | Exclusão de uma lista contendo cards associados, com definição explícita da regra de cascata (exclusão dos cards, bloqueio da ação ou migração para outra lista).                 |
| RF06 | Criação de checklists dentro de um card, com itens marcáveis como concluídos e cálculo automático do percentual de progresso exibido no próprio card.                             |
| RF07 | Convite e gerenciamento de membros do quadro em dois papéis (administrador e membro), restringindo as ações permitidas a cada papel, e atribuição de membros a cards específicos. |
| RF08 | Criação de etiquetas (labels) coloridas por quadro, associação de etiquetas a múltiplos cards e filtragem dos cards visíveis por etiqueta.                                        |
| RF09 | Adição de comentários em cards, com histórico ordenado cronologicamente e identificação do autor de cada comentário.                                                              |
| RF10 | Definição de data de vencimento (due date) em cards, com destaque visual para cards atrasados ou com vencimento próximo, e ordenação dos cards por prazo.                         |

## Grade de execuções

| #   | Metodologia                   | Modelo            |
| --- | ----------------------------- | ----------------- |
| 01  | Vibe Coding                   | Claude Haiku 4.5  |
| 02  | Vibe Coding                   | Claude Sonnet 5.5 |
| 03  | Vibe Coding                   | Claude Opus 5.5   |
| 04  | SDD (Spec-Driven Development) | Claude Haiku 4.5  |
| 05  | SDD (Spec-Driven Development) | Claude Sonnet 5.5 |
| 06  | SDD (Spec-Driven Development) | Claude Opus 5.5   |
| 07  | Self-Planning                 | Claude Haiku 4.5  |
| 08  | Self-Planning                 | Claude Sonnet 5.5 |
| 09  | Self-Planning                 | Claude Opus 5.5   |

## Critérios — Fidelidade ao protótipo

O protótipo é composto por imagens estáticas; avalia-se apenas estrutura, layout e estilo visual (o comportamento é coberto pela Auditoria Funcional). Cada uma das 10 telas é comparada individualmente com a tela produzida na execução.

- **Páginas (4):** `tela-login`, `criar-conta`, `meus-quadros`, `quadro`
- **Modais (6):** `novo-quadro`, `criar-nova-lista`, `detalhe-card`, `etiquetas`, `membros`, `excluir-lista`

Cada tela recebe nota de 0 a 2 em três dimensões: **0** divergente · **1** parcial · **2** fiel.

| Dimensão         | Avalia                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| D1 Estrutura     | elementos presentes e correspondentes (campos, botões, listas, menus, seções) |
| D2 Layout        | disposição espacial e organização dos elementos                               |
| D3 Estilo visual | cores, tipografia, ícones, identidade visual                                  |

`Nota da tela = (D1 + D2 + D3) / 6 × 100%` · `Nota da execução = média das 10 telas`

| Faixa  | Leitura           |
| ------ | ----------------- |
| ≥ 75%  | Fiel              |
| 50–74% | Parcialmente fiel |
| < 50%  | Não fiel          |

## Critérios — Complexidade ciclomática média

- **Ferramenta:** Understand (SciTools) 8.0, build 1263, linguagem Web (TypeScript/TSX), métrica `Cyclomatic` (McCabe) por função/método.
- **Escopo:** apenas código de produção em `src/` (back-end e front-end). Testes (`*.test.*`, `*.spec.*`, `__tests__/`, `tests/`) e `.d.ts` excluídos.
- **Cálculo:** média aritmética sobre todas as funções, métodos e funções anônimas. A média _geral_ é ponderada pelo nº de funções, não a média simples das duas médias.

## Execuções

### Execução 01 — Vibe Coding + Claude Haiku 4.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | 🟡 PARTIAL |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | ✅ PASS    |
| RF03 | Gerenciamento de listas dentro de um quadro          |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | ✅ PASS    |
| RF05 | Exclusão de lista com cards (regra de cascata)       | 🟡 PARTIAL |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | ❌ FAIL    |
| RF08 | Etiquetas coloridas com filtro por card              | ❌ FAIL    |
| RF09 | Comentários por card                                 | ❌ FAIL    |
| RF10 | Definição de prazos e sinalização de cards atrasados | 🟡 PARTIAL |

**Totais:** PASS 3/10 (30%) · PARTIAL 3/10 (30%) · FAIL 4/10 (40%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,59     | 97      |
| Front-end | 1,46     | 69      |
| Geral     | 1,54     | 166     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota   |
| ------------------------ | --- | --- | --- | ------ |
| tela-login               | 1,5 | 1,0 | 0,5 | 50,00% |
| criar-conta              | 1,0 | 1,0 | 0,5 | 41,67% |
| meus-quadros             | 1,0 | 1,0 | 0,5 | 41,67% |
| quadro                   | 0,5 | 1,0 | 0,5 | 33,33% |
| novo-quadro (modal)      | 0,5 | 0,0 | 0,0 | 8,33%  |
| criar-nova-lista (modal) | 0,5 | 0,0 | 0,0 | 8,33%  |
| detalhe-card (modal)     | 1,0 | 0,5 | 0,5 | 33,33% |
| etiquetas (modal)        | 0,0 | 0,0 | 0,0 | 0,00%  |
| membros (modal)          | 0,0 | 0,0 | 0,0 | 0,00%  |
| excluir-lista (modal)    | 0,5 | 0,0 | 0,0 | 8,33%  |

**Nota de fidelidade da execução:** 22,50% — **Não fiel**

### Execução 02 — Vibe Coding + Claude Sonnet 5.5

**Data:** 04/10/2026

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | 🟡 PARTIAL |
| RF03 | Gerenciamento de listas dentro de um quadro          | ✅ PASS    |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | ❌ FAIL    |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ❌ FAIL    |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | ✅ PASS    |
| RF08 | Etiquetas coloridas com filtro por card              | ❌ FAIL    |
| RF09 | Comentários por card                                 | ❌ FAIL    |
| RF10 | Definição de prazos e sinalização de cards atrasados | 🟡 PARTIAL |

**Totais:** PASS 4/10 (40%) · PARTIAL 2/10 (20%) · FAIL 4/10 (40%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,59     | 170     |
| Front-end | 1,49     | 407     |
| Geral     | 1,52     | 577     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota   |
| ------------------------ | --- | --- | --- | ------ |
| tela-login               | 2,0 | 1,5 | 0,5 | 66,67% |
| criar-conta              | 2,0 | 1,0 | 0,5 | 58,33% |
| meus-quadros             | 1,5 | 1,5 | 0,5 | 58,33% |
| quadro                   | 1,5 | 1,0 | 0,0 | 41,67% |
| novo-quadro (modal)      | 1,0 | 1,5 | 0,5 | 50,00% |
| criar-nova-lista (modal) | 2,0 | 1,0 | 0,0 | 50,00% |
| detalhe-card (modal)     | 1,0 | 0,5 | 0,5 | 33,33% |
| etiquetas (modal)        | 2,0 | 2,0 | 0,5 | 75,00% |
| membros (modal)          | 2,0 | 1,0 | 0,5 | 58,33% |
| excluir-lista (modal)    | 1,5 | 1,0 | 0,5 | 50,00% |

**Nota de fidelidade da execução:** 54,17% — **Parcialmente fiel**

### Execução 03 — Vibe Coding + Claude Opus 5.5

**Data:** 05/10/2026

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | ✅ PASS    |
| RF03 | Gerenciamento de listas dentro de um quadro          | 🟡 PARTIAL |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | ✅ PASS    |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ✅ PASS    |
| RF06 | Checklists com cálculo automático de progresso       | 🟡 PARTIAL |
| RF07 | Gerenciamento de membros e papéis por quadro         | 🟡 PARTIAL |
| RF08 | Etiquetas coloridas com filtro por card              | ✅ PASS    |
| RF09 | Comentários por card                                 | ✅ PASS    |
| RF10 | Definição de prazos e sinalização de cards atrasados | ❌ FAIL    |

**Totais:** PASS 6/10 (60%) · PARTIAL 3/10 (30%) · FAIL 1/10 (10%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,56     | 167     |
| Front-end | 1,46     | 491     |
| Geral     | 1,48     | 658     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota    |
| ------------------------ | --- | --- | --- | ------- |
| tela-login               | 2,0 | 1,5 | 2,0 | 91,67%  |
| criar-conta              | 2,0 | 1,5 | 2,0 | 91,67%  |
| meus-quadros             | 1,5 | 2,0 | 2,0 | 91,67%  |
| quadro                   | 1,5 | 1,5 | 1,0 | 66,67%  |
| novo-quadro (modal)      | 1,5 | 1,5 | 2,0 | 83,33%  |
| criar-nova-lista (modal) | 2,0 | 2,0 | 2,0 | 100,00% |
| detalhe-card (modal)     | 1,0 | 0,5 | 1,5 | 50,00%  |
| etiquetas (modal)        | 2,0 | 2,0 | 0,5 | 75,00%  |
| membros (modal)          | 2,0 | 2,0 | 1,5 | 91,67%  |
| excluir-lista (modal)    | 1,5 | 1,5 | 2,0 | 83,33%  |

**Nota de fidelidade da execução:** 82,50% — **Fiel**

### Execução 04 — SDD (Spec-Driven Development) + Claude Haiku 4.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | ✅ PASS    |
| RF03 | Gerenciamento de listas dentro de um quadro          | 🟡 PARTIAL |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | 🟡 PARTIAL |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ✅ PASS    |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | ❌ FAIL    |
| RF08 | Etiquetas coloridas com filtro por card              | 🟡 PARTIAL |
| RF09 | Comentários por card                                 | ✅ PASS    |
| RF10 | Definição de prazos e sinalização de cards atrasados | ❌ FAIL    |

**Totais:** PASS 5/10 (50%) · PARTIAL 3/10 (30%) · FAIL 2/10 (20%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,53     | 240     |
| Front-end | 1,20     | 107     |
| Geral     | 1,43     | 347     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota   |
| ------------------------ | --- | --- | --- | ------ |
| tela-login               | 1,0 | 1,0 | 0,5 | 41,67% |
| criar-conta              | 1,0 | 1,0 | 0,5 | 41,67% |
| meus-quadros             | 1,0 | 1,0 | 0,5 | 41,67% |
| quadro                   | 0,5 | 1,0 | 0,5 | 33,33% |
| novo-quadro (modal)      | 0,5 | 0,0 | 0,0 | 8,33%  |
| criar-nova-lista (modal) | 0,5 | 0,0 | 0,0 | 8,33%  |
| detalhe-card (modal)     | 0,0 | 0,0 | 0,0 | 0,00%  |
| etiquetas (modal)        | 0,0 | 0,0 | 0,0 | 0,00%  |
| membros (modal)          | 0,0 | 0,0 | 0,0 | 0,00%  |
| excluir-lista (modal)    | 0,0 | 0,0 | 0,0 | 0,00%  |

**Nota de fidelidade da execução:** 17,50% — **Não fiel**

### Execução 05 — SDD (Spec-Driven Development) + Claude Sonnet 5.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | 🟡 PARTIAL |
| RF03 | Gerenciamento de listas dentro de um quadro          | ✅ PASS    |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | 🟡 PARTIAL |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ✅ PASS    |
| RF06 | Checklists com cálculo automático de progresso       | 🟡 PARTIAL |
| RF07 | Gerenciamento de membros e papéis por quadro         | ✅ PASS    |
| RF08 | Etiquetas coloridas com filtro por card              | ✅ PASS    |
| RF09 | Comentários por card                                 | ✅ PASS    |
| RF10 | Definição de prazos e sinalização de cards atrasados | ✅ PASS    |

**Totais:** PASS 7/10 (70%) · PARTIAL 3/10 (30%) · FAIL 0/10 (0%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,40     | 252     |
| Front-end | 1,66     | 436     |
| Geral     | 1,56     | 688     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota   |
| ------------------------ | --- | --- | --- | ------ |
| tela-login               | 2,0 | 1,5 | 2,0 | 91,67% |
| criar-conta              | 2,0 | 1,5 | 2,0 | 91,67% |
| meus-quadros             | 2,0 | 1,5 | 2,0 | 91,67% |
| quadro                   | 1,5 | 2,0 | 2,0 | 91,67% |
| novo-quadro (modal)      | 2,0 | 1,5 | 2,0 | 91,67% |
| criar-nova-lista (modal) | 1,5 | 2,0 | 1,0 | 75,00% |
| detalhe-card (modal)     | 2,0 | 2,0 | 1,5 | 91,67% |
| etiquetas (modal)        | 1,0 | 1,5 | 1,5 | 66,67% |
| membros (modal)          | 2,0 | 2,0 | 1,5 | 91,67% |
| excluir-lista (modal)    | 0,5 | 0,5 | 1,0 | 33,33% |

**Nota de fidelidade da execução:** 81,67% — **Fiel**

### Execução 06 — SDD (Spec-Driven Development) + Claude Opus 5.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado |
| ---- | ---------------------------------------------------- | --------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS   |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | ✅ PASS   |
| RF03 | Gerenciamento de listas dentro de um quadro          | ✅ PASS   |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | ✅ PASS   |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ✅ PASS   |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS   |
| RF07 | Gerenciamento de membros e papéis por quadro         | ✅ PASS   |
| RF08 | Etiquetas coloridas com filtro por card              | ✅ PASS   |
| RF09 | Comentários por card                                 | ✅ PASS   |
| RF10 | Definição de prazos e sinalização de cards atrasados | ✅ PASS   |

**Totais:** PASS 10/10 (100%) · PARTIAL 0/10 (0%) · FAIL 0/10 (0%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,51     | 259     |
| Front-end | 1,37     | 417     |
| Geral     | 1,42     | 676     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota    |
| ------------------------ | --- | --- | --- | ------- |
| tela-login               | 2,0 | 2,0 | 2,0 | 100,00% |
| criar-conta              | 2,0 | 2,0 | 2,0 | 100,00% |
| meus-quadros             | 2,0 | 2,0 | 2,0 | 100,00% |
| quadro                   | 1,5 | 1,5 | 2,0 | 83,33%  |
| novo-quadro (modal)      | 2,0 | 2,0 | 2,0 | 100,00% |
| criar-nova-lista (modal) | 2,0 | 2,0 | 1,5 | 91,67%  |
| detalhe-card (modal)     | 2,0 | 2,0 | 2,0 | 100,00% |
| etiquetas (modal)        | 2,0 | 2,0 | 2,0 | 100,00% |
| membros (modal)          | 1,0 | 1,5 | 1,5 | 66,67%  |
| excluir-lista (modal)    | 2,0 | 2,0 | 2,0 | 100,00% |

**Nota de fidelidade da execução:** 94,17% — **Fiel**

### Execução 07 — Self-Planning + Claude Haiku 4.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | 🟡 PARTIAL |
| RF03 | Gerenciamento de listas dentro de um quadro          | ✅ PASS    |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | 🟡 PARTIAL |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ✅ PASS    |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | ❌ FAIL    |
| RF08 | Etiquetas coloridas com filtro por card              | ✅ PASS    |
| RF09 | Comentários por card                                 | ✅ PASS    |
| RF10 | Definição de prazos e sinalização de cards atrasados | ❌ FAIL    |

**Totais:** PASS 6/10 (60%) · PARTIAL 2/10 (20%) · FAIL 2/10 (20%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,88     | 154     |
| Front-end | 1,48     | 179     |
| Geral     | 1,66     | 333     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota   |
| ------------------------ | --- | --- | --- | ------ |
| tela-login               | 1,5 | 1,0 | 1,0 | 58,33% |
| criar-conta              | 1,5 | 1,0 | 1,0 | 58,33% |
| meus-quadros             | 1,5 | 1,5 | 1,0 | 66,67% |
| quadro                   | 1,5 | 1,5 | 1,0 | 66,67% |
| novo-quadro (modal)      | 1,0 | 0,5 | 0,5 | 33,33% |
| criar-nova-lista (modal) | 0,5 | 0,5 | 0,5 | 25,00% |
| detalhe-card (modal)     | 1,5 | 1,0 | 1,0 | 58,33% |
| etiquetas (modal)        | 0,5 | 0,0 | 0,0 | 8,33%  |
| membros (modal)          | 0,0 | 0,0 | 0,0 | 0,00%  |
| excluir-lista (modal)    | 0,5 | 0,0 | 0,0 | 8,33%  |

**Nota de fidelidade da execução:** 38,33% — **Não fiel**

### Execução 08 — Self-Planning + Claude Sonnet 5.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | ✅ PASS    |
| RF03 | Gerenciamento de listas dentro de um quadro          | ✅ PASS    |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | ✅ PASS    |
| RF05 | Exclusão de lista com cards (regra de cascata)       | 🟡 PARTIAL |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | ❌ FAIL    |
| RF08 | Etiquetas coloridas com filtro por card              | ✅ PASS    |
| RF09 | Comentários por card                                 | ✅ PASS    |
| RF10 | Definição de prazos e sinalização de cards atrasados | 🟡 PARTIAL |

**Totais:** PASS 7/10 (70%) · PARTIAL 2/10 (20%) · FAIL 1/10 (10%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,41     | 189     |
| Front-end | 1,40     | 380     |
| Geral     | 1,40     | 569     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota   |
| ------------------------ | --- | --- | --- | ------ |
| tela-login               | 2,0 | 2,0 | 1,5 | 91,67% |
| criar-conta              | 2,0 | 2,0 | 1,5 | 91,67% |
| meus-quadros             | 1,5 | 1,5 | 1,5 | 75,00% |
| quadro                   | 1,5 | 2,0 | 1,5 | 83,33% |
| novo-quadro (modal)      | 2,0 | 1,5 | 1,5 | 83,33% |
| criar-nova-lista (modal) | 1,5 | 2,0 | 1,0 | 75,00% |
| detalhe-card (modal)     | 1,5 | 1,5 | 1,0 | 66,67% |
| etiquetas (modal)        | 1,5 | 1,5 | 1,0 | 66,67% |
| membros (modal)          | 2,0 | 1,5 | 1,0 | 75,00% |
| excluir-lista (modal)    | 1,5 | 1,5 | 1,0 | 66,67% |

**Nota de fidelidade da execução:** 77,50% — **Fiel**

### Execução 09 — Self-Planning + Claude Opus 5.5

**A) Auditoria funcional**

| RF   | Requisito                                            | Resultado  |
| ---- | ---------------------------------------------------- | ---------- |
| RF01 | Autenticação de usuário (cadastro / login)           | ✅ PASS    |
| RF02 | Gerenciamento de quadros (criar/listar/editar/excl)  | ✅ PASS    |
| RF03 | Gerenciamento de listas dentro de um quadro          | ✅ PASS    |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | 🟡 PARTIAL |
| RF05 | Exclusão de lista com cards (regra de cascata)       | ✅ PASS    |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | 🟡 PARTIAL |
| RF08 | Etiquetas coloridas com filtro por card              | ✅ PASS    |
| RF09 | Comentários por card                                 | ✅ PASS    |
| RF10 | Definição de prazos e sinalização de cards atrasados | ✅ PASS    |

**Totais:** PASS 8/10 (80%) · PARTIAL 2/10 (20%) · FAIL 0/10 (0%)

**B) Complexidade ciclomática média**

| Camada    | CC média | Funções |
| --------- | -------- | ------- |
| Back-end  | 1,35     | 160     |
| Front-end | 1,37     | 355     |
| Geral     | 1,36     | 515     |

**C) Fidelidade ao protótipo**

| Tela                     | D1  | D2  | D3  | Nota    |
| ------------------------ | --- | --- | --- | ------- |
| tela-login               | 2,0 | 1,5 | 2,0 | 91,67%  |
| criar-conta              | 2,0 | 1,5 | 2,0 | 91,67%  |
| meus-quadros             | 2,0 | 1,0 | 2,0 | 83,33%  |
| quadro                   | 1,5 | 2,0 | 2,0 | 91,67%  |
| novo-quadro (modal)      | 2,0 | 2,0 | 2,0 | 100,00% |
| criar-nova-lista (modal) | 2,0 | 2,0 | 1,5 | 91,67%  |
| detalhe-card (modal)     | 1,5 | 1,0 | 2,0 | 75,00%  |
| etiquetas (modal)        | 1,5 | 1,5 | 1,5 | 75,00%  |
| membros (modal)          | 2,0 | 1,5 | 1,5 | 83,33%  |
| excluir-lista (modal)    | 2,0 | 2,0 | 1,0 | 83,33%  |

**Nota de fidelidade da execução:** **86,67%** — **Fiel**

## Quadro-resumo consolidado

| Execução                   | Taxa de aprovação | CC média | Fidelidade |
| -------------------------- | ----------------- | -------- | ---------- |
| Vibe Coding+Haiku 4.5      | 30%               | 1,54     | 22,50%     |
| Vibe Coding+Sonnet 5.5     | 40%               | 1,52     | 54,17%     |
| Vibe Coding+Opus 5.5       | 60%               | 1,48     | 82,50%     |
| SDD (Spec-Driv)+Haiku 4.5  | 50%               | 1,43     | 17,50%     |
| SDD (Spec-Driv)+Sonnet 5.5 | 70%               | 1,56     | 81,67%     |
| SDD (Spec-Driv)+Opus 5.5   | 100%              | 1,42     | 94,17%     |
| Self-Planning+Haiku 4.5    | 60%               | 1,66     | 38,33%     |
| Self-Planning+Sonnet 5.5   | 70%               | 1,40     | 77,50%     |
| Self-Planning+Opus 5.5     | 80%               | 1,36     | 86,67%     |
