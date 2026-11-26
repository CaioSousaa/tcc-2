### PROMPT 1

Esta seção deve ser executada com base no arquivo @context.md

---

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

---

### PROMPT 3

Plano: @plans/plan.md Gere o código seguindo o plano acima, passo a passo
