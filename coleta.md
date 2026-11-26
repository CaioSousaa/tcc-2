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
| RF03 | Gerenciamento de listas dentro de um quadro          | ❌ FAIL    |
| RF04 | Gerenciamento de cards (criar/editar/excluir/mover)  | ✅ PASS    |
| RF05 | Exclusão de lista com cards (regra de cascata)       | 🟡 PARTIAL |
| RF06 | Checklists com cálculo automático de progresso       | ✅ PASS    |
| RF07 | Gerenciamento de membros e papéis por quadro         | ❌ FAIL    |
| RF08 | Etiquetas coloridas com filtro por card              | ❌ FAIL    |
| RF09 | Comentários por card                                 | ❌ FAIL    |
| RF10 | Definição de prazos e sinalização de cards atrasados | 🟡 PARTIAL |

**Totais:** PASS 3/10 (30%) · PARTIAL 3/10 (30%) · FAIL 4/10 (40%)

- **RF01 (PARTIAL):** A autenticação por token foi implementada, mas a sessão não se mantinha ao recarregar a página: o usuário era enviado ao login antes de o perfil ser restaurado. A ação de sair também não funcionava.
- **RF03 (FAIL):** O back-end tinha rotas para renomear e reordenar listas, mas a interface só permitia criar e excluir listas, sem meio de renomeá-las ou reordená-las.
- **RF05 (PARTIAL):** A exclusão em cascata foi definida e confirmada ao usuário, mas falhava quando os cards tinham comentários, checklists, etiquetas ou responsáveis, porque as chaves estrangeiras não previam a cascata, e o erro não aparecia na interface.
- **RF07 (FAIL):** O back-end expunha rotas de convite e atribuição, mas não havia tela para convidar membros, gerenciar papéis ou atribuí-los a cards, e as permissões consideravam apenas o dono do quadro, sem distinguir administrador de membro.
- **RF08 (FAIL):** As etiquetas existiam apenas no back-end; na interface não era possível criá-las, associá-las a cards nem filtrar os cards por etiqueta.
- **RF09 (FAIL):** Os comentários eram exibidos com o autor, mas sem ordenação cronológica garantida e apenas com a data, e a tela do card, onde ficavam, não era acessível a partir do quadro.
- **RF10 (PARTIAL):** A data de vencimento foi implementada, mas o destaque de atraso aparecia só no detalhe do card, sem sinalização de vencimento próximo no quadro e sem ordenação por prazo.

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

- **RF02 (PARTIAL):** O CRUD de quadros foi implementado, mas editar um quadro a partir da tela de quadros desativava a regra de bloqueio de exclusão de listas, porque esse campo não vinha na listagem da API.
- **RF04 (FAIL):** Na verificação com a aplicação em execução, a manipulação de cards não foi concluída pela interface, e o requisito não atendeu aos critérios de aceite.
- **RF05 (FAIL):** A exclusão de lista oferecia mover, excluir ou bloquear os cards, mas a regra de bloqueio era desativada sempre que o quadro era editado pela tela de quadros, e, na verificação com a aplicação em execução, a operação não atendeu aos critérios de aceite.
- **RF08 (FAIL):** Na verificação com a aplicação em execução, a gestão de etiquetas não foi concluída pela interface, e o requisito não atendeu aos critérios de aceite.
- **RF09 (FAIL):** Na verificação com a aplicação em execução, a inclusão de comentários não foi concluída pela interface, e o requisito não atendeu aos critérios de aceite.
- **RF10 (PARTIAL):** O destaque de atraso e de vencimento próximo foi implementado, mas a ordenação por prazo era apenas uma visualização temporária em cada lista, não persistida, que desabilitava a movimentação dos cards.

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

- **RF03 (PARTIAL):** A gestão de listas foi implementada, mas a reordenação por arraste ficava indisponível com filtro ou ordenação ativos, e a renomeação só era possível por um modal de edição.
- **RF06 (PARTIAL):** Os checklists e o cálculo do progresso foram implementados, mas o card mostrava apenas a barra e a fração de itens concluídos; o percentual aparecia só como dica ao passar o cursor.
- **RF07 (PARTIAL):** O gerenciamento de membros e papéis foi implementado, mas a entrada no quadro dependia de o convidado já ter conta e aceitar o convite, e um membro comum só podia atribuir a si mesmo aos cards.
- **RF10 (FAIL):** Na verificação com a aplicação em execução, a sinalização de prazos dos cards não foi concluída pela interface, e o requisito não atendeu aos critérios de aceite.

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

- **RF03 (PARTIAL):** O back-end permitia criar, renomear, reordenar e excluir listas, mas a interface só oferecia a criação, sem controles para renomear, reordenar ou excluir colunas.
- **RF04 (PARTIAL):** As operações com cards foram implementadas na API, mas a interface não oferecia ações para criar, editar, excluir ou mover cards, e o carregamento do quadro não trazia os cards das listas.
- **RF07 (FAIL):** Não havia rotas nem interface para convidar membros, gerenciar papéis ou atribuí-los a cards. As entidades existiam só no modelo de dados, com quatro papéis em vez de dois, e o resultado da verificação de permissão era ignorado.
- **RF08 (PARTIAL):** A criação de etiquetas coloridas por quadro foi implementada na API, mas não havia associação de etiquetas a cards nem filtro por etiqueta, e a interface não exibia etiquetas.
- **RF10 (FAIL):** A data de vencimento existia apenas como campo do card na API; a interface não permitia defini-la, não destacava cards atrasados ou próximos do vencimento e não ordenava por prazo.

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

- **RF02 (PARTIAL):** O CRUD de quadros foi implementado, mas a listagem reunia todos os quadros de que o usuário participava, sem separar os de sua propriedade, e a edição e a exclusão ficavam restritas ao administrador.
- **RF04 (PARTIAL):** As operações com cards foram implementadas, mas o arraste ficava desabilitado com filtro ou ordenação ativos, e cancelar diálogos internos, como a confirmação de exclusão, fechava também o detalhe do card.
- **RF06 (PARTIAL):** O progresso dos checklists era calculado, mas o card exibia apenas a barra e a fração de itens concluídos, sem o percentual, que só aparecia no detalhe quando havia mais de um checklist.

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

- **RF02 (PARTIAL):** A criação, a listagem e a exclusão de quadros foram implementadas, mas não havia edição na interface, e as rotas de edição e exclusão acessavam o dono do quadro sem carregar a relação, o que exigia ajuste manual.
- **RF04 (PARTIAL):** A criação, a edição e a exclusão de cards foram implementadas, mas não havia movimentação entre listas na interface, e a rota de movimentação não verificava se a lista de destino era do mesmo quadro.
- **RF07 (FAIL):** Não havia interface para convidar ou gerenciar membros, o back-end não restringia ações por papel e adotava três papéis em vez de dois, e a seleção de responsáveis no card não era salva.
- **RF10 (FAIL):** O destaque cobria apenas cards vencidos, sem sinalização de vencimento próximo, e o seletor de ordenação por prazo não tinha efeito sobre as listas.

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

**Justificativas (PARTIAL/FAIL)** — registradas em 23/11/2026

- **RF05 (PARTIAL):** A exclusão de lista com cards oferecia mover ou excluir os cards, mas o modal mostrava uma terceira opção de bloqueio, sempre desabilitada e sem configuração correspondente, o que deixava a regra ambígua.
- **RF07 (FAIL):** Na verificação com a aplicação em execução, a gestão de membros do quadro não foi concluída pela interface, e o requisito não atendeu aos critérios de aceite.
- **RF10 (PARTIAL):** O destaque e a ordenação por prazo foram implementados, mas, sem um estado de conclusão, cards já finalizados continuavam sinalizados como atrasados, e a ordenação desabilitava o arraste dos cards.

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

- **RF04 (PARTIAL):** As operações com cards foram implementadas, mas o arraste ficava desabilitado com filtros ativos, e a movimentação pelo detalhe do card só enviava o card ao fim da lista de destino.
- **RF07 (PARTIAL):** O gerenciamento de membros e a atribuição a cards foram implementados, mas com três papéis (administrador, editor e observador) em vez dos dois exigidos.

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
