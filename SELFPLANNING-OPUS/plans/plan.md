# Plano de Implementação

**Intenção:** Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões. Depois de autenticado, ele deve conseguir criar, ver, editar e excluir seus próprios quadros e, dentro de cada quadro, criar, renomear, reordenar e excluir listas. Nas listas, o usuário deve conseguir criar, editar, excluir e mover cards entre as listas do quadro, e o sistema deve tratar adequadamente o que acontece com os cards quando uma lista que contém cards é excluída. Quero também que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa, que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes e atribuí-los a cards, que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas, comentar nos cards e ver o histórico dos comentários, e, por fim, definir prazos nos cards e identificar quais estão atrasados.

**Plano:**

1. Criar os modelos de usuário, quadro, membro do quadro (com papel: administrador, editor ou observador), lista (com posição), card (com posição, descrição, prazo e indicador de concluído), checklist, item de checklist, etiqueta, comentário e as relações de card com etiquetas e com membros atribuídos
2. Criar um endpoint de cadastro que valide os dados, verifique se o e-mail já está em uso e salve o usuário com a senha criptografada
3. Criar um endpoint de login que valide as credenciais e retorne um token de acesso e um token de renovação persistido
4. Criar um endpoint para renovar o token de acesso a partir do token de renovação, um endpoint de logout que invalide o token de renovação e um endpoint que retorne o usuário autenticado
5. Criar um middleware de autenticação que valide o token de acesso e identifique o usuário em todas as rotas protegidas
6. Criar um middleware de autorização que verifique se o usuário é membro do quadro acessado e se o papel dele permite a ação (observador só lê, editor altera listas, cards, checklists, etiquetas e comentários, administrador também gerencia o quadro e os membros)
7. Criar um endpoint para criar um quadro, registrando o criador como administrador
8. Criar um endpoint para listar os quadros dos quais o usuário é membro e um endpoint para ver um quadro com suas listas e cards ordenados por posição
9. Criar endpoints para editar e excluir um quadro, permitidos apenas ao administrador, com a exclusão removendo em cascata listas, cards e dados relacionados
10. Criar um endpoint para criar uma lista no quadro, posicionada ao final
11. Criar endpoints para renomear uma lista e para reordenar as listas do quadro, recalculando as posições
12. Criar um endpoint para excluir uma lista que receba opcionalmente uma lista de destino do mesmo quadro
13. Se a lista de destino for informada, mover os cards da lista excluída para o final dela; se não for, excluir os cards junto com a lista, e no front-end exigir confirmação mostrando a quantidade de cards afetados e a opção de escolher a lista de destino
14. Criar endpoints para criar, editar (título, descrição, prazo e concluído) e excluir um card
15. Criar um endpoint para mover um card para outra lista do mesmo quadro ou para outra posição na mesma lista, reajustando as posições dos cards nas listas de origem e de destino
16. Criar endpoints para adicionar, renomear e excluir checklists em um card e para adicionar, editar, marcar, desmarcar e excluir itens do checklist
17. Calcular o progresso de cada checklist e do card (itens concluídos sobre o total) e retorná-lo junto com os dados do card
18. Criar um endpoint para o administrador convidar um membro ao quadro pelo e-mail de um usuário cadastrado, definindo o papel
19. Se o e-mail não existir ou o usuário já for membro, retornar um erro apropriado
20. Criar endpoints para listar os membros do quadro, alterar o papel de um membro e remover um membro, impedindo que o quadro fique sem nenhum administrador
21. Ao remover um membro, retirar também as atribuições dele nos cards do quadro
22. Criar endpoints para atribuir e desatribuir membros do quadro a um card
23. Criar endpoints para criar, editar e excluir etiquetas do quadro com nome e cor
24. Criar endpoints para aplicar e remover etiquetas de um card
25. Permitir que o endpoint de visualização do quadro receba etiquetas como filtro opcional e retorne apenas os cards que possuem alguma delas
26. Criar um endpoint para adicionar um comentário a um card, registrando o autor e a data
27. Criar um endpoint para listar os comentários do card em ordem cronológica, com autor e data, e endpoints para o autor editar ou excluir o próprio comentário
28. Marcar como atrasado todo card com prazo anterior à data atual que não esteja concluído e retornar essa informação nos dados do card
29. Permitir que o endpoint de visualização do quadro receba um filtro opcional para retornar apenas os cards atrasados
30. No front-end, criar o cliente HTTP que envie o token de acesso, renove o token automaticamente quando expirar e redirecione para o login quando a renovação falhar
31. Criar as telas de cadastro e login e manter a sessão salva no navegador para que o usuário continue autenticado ao reabrir a aplicação
32. Criar a tela de quadros com listagem, criação, edição e exclusão
33. Criar a tela do quadro com as listas em colunas, permitindo criar, renomear, reordenar e excluir listas e criar, mover e reordenar cards arrastando
34. Criar o modal de detalhes do card com edição de título, descrição e prazo, marcação de concluído, checklists com barra de progresso, etiquetas, membros atribuídos e comentários
35. Exibir nos cards da lista as etiquetas, o progresso do checklist, os membros atribuídos e o prazo, destacando os atrasados
36. Criar a barra de filtros do quadro por etiquetas e por cards atrasados
37. Criar o painel de membros do quadro para o administrador convidar, alterar papéis e remover membros, e esconder as ações não permitidas pelo papel do usuário
38. Seguir o protótipo de referência para o layout e o estilo de todas as telas
