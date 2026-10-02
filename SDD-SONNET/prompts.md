### PROMPT 1

Esta seção deve ser executada com base no arquivo @context.md

---

### PROMPT 2

FASE 2: PLAN Leia @docs/spec.md Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?". Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar. O plano deve cobrir:1 As tecnologias e frameworks apropriados ao problema2 A arquitetura de componentes e suas fronteiras3 Os modelos de dados e schemas4 As interfaces: APIs, mensagens e contratos5 Os requisitos não funcionais de desempenho, segurança e escalabilidade Deixe explícitas as restrições que a implementação deverá obedecer. Não gere código. Salve o plano em docs/plan.md

---

### PROMPT 3

FASE 3: IMPLEMENT Leia @docs/spec.md e @docs/plan.md Com base na especificação e no plano técnico aprovados, implemente os requisitos. Proceda assim:1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/tasks.md antes de começar a implementar2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez3 Verifique se o código produzido está alinhado à especificação e ao plano4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis Ao final, atualize docs/tasks.md indicando o estado de cada tarefa.

---

### PROMPT 4

FASE 4: VALIDATE Leia @docs/spec.md e @docs/plan.md Verifique se o código implementado atende de fato à especificação. Execute:1 Os testes automatizados nos níveis unitário, de integração e de aceite
