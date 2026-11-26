# Prompts utilizados nas execuções

Este arquivo reúne os prompts usados em cada uma das nove execuções do estudo. Cada metodologia teve uma sequência própria de prompts, aplicada de forma idêntica aos três modelos avaliados (Claude Haiku 4.5, Claude Sonnet 5.5 e Claude Opus 5.5), em sessões separadas e na ordem em que aparecem abaixo.

- **Vibe Coding:** projetos `VIBECODE-HAIKU`, `VIBECODE-SONNET` e `VIBECODE-OPUS`
- **SDD (Spec-Driven Development):** projetos `SDD-HAIKU`, `SDD-SONNET` e `SDD-OPUS`
- **Self-Planning:** projetos `SELFPLANNING-HAIKU`, `SELFPLANNING-SONNET` e `SELFPLANNING-OPUS`

---

## Prompts do Vibe Coding

### PROMPT 1

Esta seção deve ser executada com base no arquivo @context.md

### PROMPT 2

Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões. Depois de autenticado, ele deve conseguir criar, ver, editar e excluir seus próprios quadros e, dentro de cada quadro, criar, renomear, reordenar e excluir listas. Nas listas, o usuário deve conseguir criar, editar, excluir e mover cards entre as listas do quadro, e o sistema deve tratar adequadamente o que acontece com os cards quando uma lista que contém cards é excluída. Quero também que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa, que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes e atribuí-los a cards, que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas, comentar nos cards e ver o histórico dos comentários, e, por fim, definir prazos nos cards e identificar quais estão atrasados.

---

## Prompts do SDD (Spec-Driven Development)

### PROMPT 1

Esta seção deve ser executada com base no arquivo @context.md

### PROMPT 2

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões. Depois de autenticado, ele deve conseguir criar, ver, editar e excluir seus próprios quadros e, dentro de cada quadro, criar, renomear, reordenar e excluir listas. Nas listas, o usuário deve conseguir criar, editar, excluir e mover cards entre as listas do quadro, e o sistema deve tratar adequadamente o que acontece com os cards quando uma lista que contém cards é excluída. Quero também que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa, que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes e atribuí-los a cards, que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas, comentar nos cards e ver o histórico dos comentários, e, por fim, definir prazos nos cards e identificar quais estão atrasados.

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir". A especificação deve conter:

1. A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2. Os critérios de aceite no formato Given/When/Then
3. As regras de negócio e restrições, capturadas explicitamente
4. Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente. Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase. Não gere código. Salve a especificação em docs/spec.md

### PROMPT 3

FASE 2: PLAN

Leia @docs/spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?". Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar. O plano deve cobrir:

1. As tecnologias e frameworks apropriados ao problema
2. A arquitetura de componentes e suas fronteiras
3. Os modelos de dados e schemas
4. As interfaces: APIs, mensagens e contratos
5. Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer. Não gere código. Salve o plano em docs/plan.md

### PROMPT 4

FASE 3: IMPLEMENT

Leia @docs/spec.md e @docs/plan.md

Com base na especificação e no plano técnico aprovados, implemente os requisitos. Proceda assim:

1. Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/tasks.md antes de começar a implementar
2. Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3. Verifique se o código produzido está alinhado à especificação e ao plano
4. Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/tasks.md indicando o estado de cada tarefa.

### PROMPT 5

FASE 4: VALIDATE

Leia @docs/spec.md e @docs/plan.md

Verifique se o código implementado atende de fato à especificação. Execute os testes automatizados nos níveis unitário, de integração e de aceite.

---

## Prompts do Self-Planning

### PROMPT 1

Esta seção deve ser executada com base no arquivo @context.md

### PROMPT 2

Intenção: O usuário deve conseguir adicionar e remover produtos do carrinho

Plano:

1. Criar um modelo de carrinho vinculado ao usuário
2. Criar um endpoint para adicionar um produto ao carrinho
3. Se o produto já estiver no carrinho, incrementar a quantidade
4. Criar um endpoint para remover um produto do carrinho
5. Criar um endpoint para listar os itens do carrinho com o total

Intenção: O usuário deve conseguir finalizar o pedido com cálculo de frete

Plano:

1. Criar um endpoint para finalizar o pedido a partir do carrinho
2. Validar se o carrinho possui itens
3. Calcular o valor do frete com base no endereço informado
4. Somar o valor dos itens e o frete para obter o total
5. Criar o registro do pedido e esvaziar o carrinho
6. Retornar o pedido criado com o resumo dos valores

Intenção: O usuário deve conseguir ver o histórico de pedidos filtrado por período

Plano:

1. Criar um endpoint para listar os pedidos do usuário autenticado
2. Receber o período inicial e final como parâmetros opcionais
3. Se o período for informado, filtrar os pedidos por data de criação
4. Ordenar os pedidos do mais recente para o mais antigo
5. Retornar a lista com os dados resumidos de cada pedido

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões. Depois de autenticado, ele deve conseguir criar, ver, editar e excluir seus próprios quadros e, dentro de cada quadro, criar, renomear, reordenar e excluir listas. Nas listas, o usuário deve conseguir criar, editar, excluir e mover cards entre as listas do quadro, e o sistema deve tratar adequadamente o que acontece com os cards quando uma lista que contém cards é excluída. Quero também que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa, que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes e atribuí-los a cards, que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas, comentar nos cards e ver o histórico dos comentários, e, por fim, definir prazos nos cards e identificar quais estão atrasados.

Plano: Salve o plano gerado em plans/plan.md

### PROMPT 3

Plano: @plans/plan.md Gere o código seguindo o plano acima, passo a passo
