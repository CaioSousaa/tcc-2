### PROMPT 1

Esta seção deve ser executada com base no arquivo @context.md

---

### PROMPT 2

FASE 1: SPECIFY INTENÇÃO: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões. Depois de autenticado, ele deve conseguir criar, ver, editar e excluir seus próprios quadros e, dentro de cada quadro, criar, renomear, reordenar e excluir listas. Nas listas, o usuário deve conseguir criar, editar, excluir e mover cards entre as listas do quadro, e o sistema deve tratar adequadamente o que acontece com os cards quando uma lista que contém cards é excluída. Quero também que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa, que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes e atribuí-los a cards, que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas, comentar nos cards e ver o histórico dos comentários, e, por fim, definir prazos nos cards e identificar quais estão atrasados. Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir". A especificação deve conter:1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário2 Os critérios de aceite no formato Given/When/Then3 As regras de negócio e restrições, capturadas explicitamente4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação A especificação deve ser:- focada em comportamento: descreve o que acontece, não como é feito- testável: cada requisito precisa ser verificável- não ambígua: leitores diferentes devem chegar à mesma interpretação- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente. Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase. Não gere código. Salve a especificação em docs/spec.md

---

### PROMPT 3

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?". Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar. O plano deve cobrir:1 As tecnologias e frameworks apropriados ao problema2 A arquitetura de componentes e suas fronteiras3 Os modelos de dados e schemas4 As interfaces: APIs, mensagens e contratos5 Os requisitos não funcionais de desempenho, segurança e escalabilidade Deixe explícitas as restrições que a implementação deverá obedecer. Não gere código. Salve o plano em docs/plan.md

---

### PROMPT 4

FASE 3: IMPLEMENT Leia @docs/spec.md e @docs/plan.md Com base na especificação e no plano técnico aprovados, implemente os requisitos. Proceda assim:1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/tasks.md antes de começar a implementar2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez3 Verifique se o código produzido está alinhado à especificação e ao plano4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis Ao final, atualize docs/tasks.md indicando o estado de cada tarefa.

---

### PROMPT 5

FASE 4: VALIDATE Leia @docs/spec.md e @docs/plan.md Verifique se o código implementado atende de fato à especificação. Execute Os testes automatizados nos níveis unitário, de integração e de aceite
