# Especificação Funcional: Gerenciador de Quadros de Tarefas

Fase 1 (Specify). Este documento descreve **o que** o sistema deve fazer, do ponto de vista de quem o usa. Não define tecnologia, arquitetura nem implementação.

## 0. Convenções

- **Usuário**: pessoa com conta no sistema.
- **Quadro**: espaço de trabalho que contém listas. Pertence a um conjunto de membros.
- **Lista**: coluna ordenada dentro de um quadro, que contém cards.
- **Card**: unidade de tarefa dentro de uma lista.
- **Membro**: usuário que participa de um quadro com um papel.
- **Papéis**: **Administrador**, **Membro** (editor) e **Observador** (somente leitura). Detalhados na seção 3.
- **Hoje**: a data atual no fuso horário do usuário que está visualizando.
- Todo texto informado pelo usuário é considerado após remover espaços no início e no fim. Um texto que fique vazio após essa limpeza é tratado como não informado.
- Os identificadores (RF-xx, CA-xx, RN-xx, CB-xx) servem para rastreabilidade entre seções.

## 1. Comportamento esperado do sistema

### 1.1 Conta e autenticação

- **RF-01** Uma pessoa não autenticada pode criar uma conta informando nome, e-mail e senha. Ao concluir o cadastro com sucesso, já fica autenticada e vê a sua lista de quadros.
- **RF-02** Uma pessoa com conta pode fazer login com e-mail e senha.
- **RF-03** Uma vez autenticado, o usuário permanece autenticado ao fechar e reabrir o navegador, sem precisar informar as credenciais de novo, até que a sessão expire ou ele saia explicitamente.
- **RF-04** O usuário autenticado pode sair (logout). Depois disso, o acesso às áreas protegidas exige novo login.
- **RF-05** Qualquer tentativa de acessar uma área protegida sem estar autenticado leva o usuário à tela de login. Depois do login, ele é levado ao que tentava acessar, quando isso ainda for permitido.

### 1.2 Quadros

- **RF-06** O usuário autenticado vê a lista dos quadros de que participa, com nome e o seu papel em cada um. Quando não participa de nenhum, vê um estado vazio que o convida a criar o primeiro quadro.
- **RF-07** O usuário pode criar um quadro informando um nome. Quem cria o quadro torna-se seu Administrador.
- **RF-08** O Administrador pode renomear o quadro.
- **RF-09** O Administrador pode excluir o quadro, após confirmação explícita. A exclusão remove definitivamente o quadro e tudo o que ele contém.
- **RF-10** Ao abrir um quadro, o usuário vê suas listas na ordem definida, e os cards de cada lista na ordem definida.

### 1.3 Listas

- **RF-11** Administradores e Membros podem criar uma lista no quadro. A nova lista aparece depois das existentes.
- **RF-12** Administradores e Membros podem renomear uma lista.
- **RF-13** Administradores e Membros podem reordenar as listas do quadro. A nova ordem é mantida ao recarregar e vista por todos os membros.
- **RF-14** Administradores e Membros podem excluir uma lista.
  - Se a lista estiver vazia, ela é excluída após confirmação.
  - Se a lista contiver cards, o sistema informa quantos cards ela contém e exige que o usuário escolha entre duas opções: **(a) mover os cards para outra lista do mesmo quadro**, ou **(b) excluir a lista junto com os cards**. Nada é alterado até a escolha ser confirmada.
  - Na opção (a), os cards movidos são acrescentados ao final da lista de destino, na mesma ordem relativa em que estavam.

### 1.4 Cards

- **RF-15** Administradores e Membros podem criar um card em uma lista, informando um título e, opcionalmente, uma descrição. O novo card aparece no final da lista.
- **RF-16** Administradores e Membros podem editar título e descrição de um card.
- **RF-17** Administradores e Membros podem excluir um card, após confirmação. A exclusão remove também seus checklists, comentários, atribuições e associações com etiquetas.
- **RF-18** Administradores e Membros podem mover um card para outra lista do mesmo quadro, escolhendo a posição de destino, e reordenar cards dentro da mesma lista. A posição resultante é mantida ao recarregar e vista por todos os membros.
- **RF-19** Todo usuário com acesso ao quadro, inclusive Observador, pode abrir um card e ver todos os seus detalhes.
- **RF-20** Administradores e Membros podem marcar um card como **concluído** e reabri-lo. A marcação é independente da lista em que o card está.

### 1.5 Checklists e progresso

- **RF-21** Administradores e Membros podem adicionar a um card um ou mais checklists, cada um com um título.
- **RF-22** Dentro de um checklist, podem adicionar, editar e excluir itens, e marcar ou desmarcar um item como feito.
- **RF-23** Podem renomear e excluir um checklist, inclusive com seus itens.
- **RF-24** O card exibe seu **progresso**: quantidade de itens feitos sobre o total de itens, somando todos os checklists do card (por exemplo, "3/5") e o percentual correspondente. O progresso aparece tanto no card visto dentro da lista quanto nos detalhes do card, e é atualizado imediatamente a cada mudança. Um card sem nenhum item não exibe progresso.

### 1.6 Membros e atribuição

- **RF-25** O Administrador pode convidar uma pessoa para o quadro informando o e-mail de uma conta existente e escolhendo o papel. A pessoa passa a ser membro imediatamente, sem etapa de aceite, e o quadro aparece na lista dela.
- **RF-26** O Administrador pode alterar o papel de um membro e remover um membro do quadro.
- **RF-27** Qualquer membro pode ver a lista de membros do quadro, com nome e papel.
- **RF-28** Um membro pode deixar o quadro por conta própria.
- **RF-29** Administradores e Membros podem atribuir um ou mais membros do quadro a um card e remover atribuições. Os responsáveis aparecem no card, tanto na lista quanto nos detalhes.

### 1.7 Etiquetas e filtro

- **RF-30** Administradores e Membros podem criar etiquetas no quadro, cada uma com nome e uma cor escolhida entre as opções oferecidas pelo sistema. Podem também editar nome e cor, e excluir etiquetas.
- **RF-31** Administradores e Membros podem aplicar e remover etiquetas em um card. Um card pode ter várias etiquetas.
- **RF-32** Qualquer membro pode filtrar os cards do quadro por etiquetas, escolhendo uma ou mais. O filtro mostra apenas os cards que tenham ao menos uma das etiquetas escolhidas. O filtro pode ser limpo a qualquer momento. O filtro é apenas uma forma de visualização: não altera dados e não afeta o que os outros membros veem.

### 1.8 Comentários

- **RF-33** Administradores e Membros podem comentar em um card.
- **RF-34** Todo usuário com acesso ao quadro vê o histórico de comentários do card, com texto, autor e data e hora de cada comentário, do mais antigo para o mais recente.

### 1.9 Prazos

- **RF-35** Administradores e Membros podem definir, alterar e remover o prazo de um card. O prazo é uma data (sem horário).
- **RF-36** Um card está **atrasado** quando tem prazo anterior a Hoje e não está concluído. Cards atrasados são visualmente identificados, na lista e nos detalhes, de forma distinta dos cards com prazo em dia.
- **RF-37** Qualquer membro pode filtrar o quadro para ver apenas os cards atrasados. Esse filtro pode ser combinado com o filtro por etiquetas (RN-27).

## 2. Critérios de aceite (Given/When/Then)

### 2.1 Cadastro e login

- **CA-01** *Given* uma pessoa sem conta, *When* informa nome, e-mail ainda não cadastrado e senha com no mínimo 8 caracteres, *Then* a conta é criada, a pessoa fica autenticada e vê a lista de quadros vazia.
- **CA-02** *Given* já existe conta com o e-mail `ana@exemplo.com`, *When* alguém tenta se cadastrar com `ANA@exemplo.com`, *Then* o cadastro é recusado com a indicação de que o e-mail já está em uso, e nenhuma conta nova é criada.
- **CA-03** *Given* o formulário de cadastro, *When* o e-mail tem formato inválido, a senha tem menos de 8 caracteres, ou o nome está vazio, *Then* o cadastro é recusado indicando qual campo está inválido e por quê, e os demais campos preenchidos são preservados.
- **CA-04** *Given* uma conta existente, *When* o usuário informa e-mail e senha corretos, *Then* fica autenticado e vê seus quadros.
- **CA-05** *Given* uma conta existente, *When* o usuário informa senha incorreta, ou um e-mail que não tem conta, *Then* o login é recusado com a **mesma** mensagem genérica nos dois casos, sem revelar se o e-mail existe.
- **CA-06** *Given* um usuário autenticado há menos de 7 dias, *When* fecha o navegador e o reabre depois, *Then* continua autenticado e acessa seus quadros sem novo login.
- **CA-07** *Given* uma sessão com mais de 7 dias desde o login, *When* o usuário tenta acessar uma área protegida, *Then* é levado ao login.
- **CA-08** *Given* um usuário autenticado, *When* faz logout, *Then* é levado ao login e, ao tentar voltar a uma área protegida, é novamente levado ao login.
- **CA-09** *Given* um visitante não autenticado, *When* acessa diretamente o endereço de um quadro, *Then* é levado ao login e, após autenticar-se com sucesso e se for membro daquele quadro, é levado a ele.

### 2.2 Quadros

- **CA-10** *Given* um usuário autenticado, *When* cria um quadro com nome válido, *Then* o quadro aparece na sua lista com o papel Administrador e abre sem listas.
- **CA-11** *Given* o formulário de criação de quadro, *When* o nome está vazio, só tem espaços, ou excede 100 caracteres, *Then* a criação é recusada indicando o motivo.
- **CA-12** *Given* o usuário A, administrador do quadro Q, e o usuário B, sem vínculo com Q, *When* B lista seus quadros, *Then* Q não aparece.
- **CA-13** *Given* o usuário B sem vínculo com Q, *When* tenta abrir Q pelo endereço, *Then* recebe a resposta de que o quadro não foi encontrado, igual à de um quadro que não existe.
- **CA-14** *Given* o administrador de Q, *When* renomeia Q com um nome válido, *Then* o novo nome aparece para todos os membros.
- **CA-15** *Given* o administrador de Q, *When* escolhe excluir Q e confirma, *Then* Q, suas listas, cards, checklists, comentários e etiquetas deixam de existir e Q some da lista de todos os seus membros.
- **CA-16** *Given* o administrador de Q, *When* escolhe excluir Q e cancela a confirmação, *Then* nada é alterado.
- **CA-17** *Given* um Membro ou Observador de Q, *When* tenta renomear ou excluir Q (inclusive por requisição direta), *Then* a ação é recusada por falta de permissão e nada é alterado. As opções correspondentes não são oferecidas na interface.

### 2.3 Listas

- **CA-18** *Given* um Administrador ou Membro em Q, *When* cria uma lista com nome válido, *Then* ela aparece após a última lista existente.
- **CA-19** *Given* um Administrador ou Membro em Q com as listas A, B, C, *When* move C para antes de A, *Then* a ordem passa a ser C, A, B e permanece assim ao recarregar e para os demais membros.
- **CA-20** *Given* uma lista com nome atual "A fazer", *When* um Administrador ou Membro a renomeia para "Backlog", *Then* o novo nome é exibido e os cards permanecem nela.
- **CA-21** *Given* uma lista vazia, *When* o usuário a exclui e confirma, *Then* a lista deixa de existir e as demais mantêm a ordem relativa.
- **CA-22** *Given* uma lista L com 3 cards e outra lista M no mesmo quadro, *When* o usuário aciona a exclusão de L, *Then* o sistema informa que L tem 3 cards e pede para escolher entre mover para outra lista ou excluir junto, sem alterar nada até a confirmação.
- **CA-23** *Given* o diálogo do CA-22, *When* o usuário escolhe mover os cards para M e confirma, *Then* L deixa de existir e os 3 cards aparecem ao final de M, na mesma ordem relativa, mantendo checklists, comentários, etiquetas, responsáveis e prazo.
- **CA-24** *Given* o diálogo do CA-22, *When* o usuário escolhe excluir os cards e confirma, *Then* L e seus 3 cards deixam de existir, junto com checklists, comentários e atribuições deles.
- **CA-25** *Given* o diálogo do CA-22, *When* o usuário cancela, *Then* L e seus cards permanecem intactos.
- **CA-26** *Given* L é a única lista do quadro e contém cards, *When* o usuário aciona a exclusão de L, *Then* a opção de mover não é oferecida e apenas a exclusão com os cards está disponível, após confirmação.
- **CA-27** *Given* um Observador em Q, *When* tenta criar, renomear, reordenar ou excluir uma lista, *Then* a ação é recusada por falta de permissão e as opções não são oferecidas na interface.

### 2.4 Cards

- **CA-28** *Given* uma lista L, *When* um Administrador ou Membro cria um card com título válido, *Then* o card aparece no final de L, sem descrição, sem prazo, sem responsáveis, não concluído.
- **CA-29** *Given* o formulário de card, *When* o título está vazio, só tem espaços, ou excede 200 caracteres, ou a descrição excede 5.000 caracteres, *Then* a gravação é recusada indicando o motivo e o conteúdo digitado é preservado.
- **CA-30** *Given* um card existente, *When* um Administrador ou Membro altera título e/ou descrição com valores válidos, *Then* as mudanças aparecem imediatamente e para os demais membros.
- **CA-31** *Given* um card na lista A, *When* um Administrador ou Membro o move para a posição 2 da lista B, *Then* o card aparece como segundo de B, deixa de aparecer em A, e as posições dos demais cards em A e B permanecem coerentes, sem lacunas nem duplicações.
- **CA-32** *Given* um card na lista A, *When* é movido para uma lista vazia B, *Then* torna-se o único card de B.
- **CA-33** *Given* uma lista com cards 1, 2, 3, *When* o card 3 é movido para a primeira posição da mesma lista, *Then* a ordem passa a ser 3, 1, 2.
- **CA-34** *Given* um card com checklists, comentários, etiquetas, responsáveis e prazo, *When* é movido para outra lista, *Then* todos esses dados são preservados.
- **CA-35** *Given* um card, *When* um Administrador ou Membro o exclui e confirma, *Then* ele deixa de existir, com seus checklists, comentários, atribuições e associações com etiquetas. As etiquetas em si continuam existindo no quadro.
- **CA-36** *Given* um Observador, *When* abre um card, *Then* vê todos os detalhes, mas não dispõe de controles para criar, editar, mover, excluir, comentar nem alterar nada, e tentativas diretas são recusadas.
- **CA-37** *Given* um card não concluído, *When* um Administrador ou Membro o marca como concluído, *Then* o card exibe o estado concluído; e ao reabri-lo, deixa de exibi-lo.

### 2.5 Checklists

- **CA-38** *Given* um card sem checklists, *When* um Administrador ou Membro adiciona o checklist "Entrega" com título válido, *Then* o checklist aparece vazio e o card não exibe progresso.
- **CA-39** *Given* o checklist "Entrega" com 4 itens, sendo 1 feito, *When* o usuário marca um segundo item como feito, *Then* o progresso passa de 1/4 (25%) para 2/4 (50%), na lista e nos detalhes, sem recarregar.
- **CA-40** *Given* um card com dois checklists, um com 2 itens (1 feito) e outro com 3 itens (2 feitos), *Then* o progresso do card é 3/5 (60%).
- **CA-41** *Given* um card com todos os itens feitos, *Then* o progresso é 100%. *When* um novo item não feito é adicionado, *Then* o progresso é recalculado e deixa de ser 100%.
- **CA-42** *Given* um card com itens, *When* um item feito é excluído, *Then* o numerador e o denominador diminuem em 1. *When* um item não feito é excluído, *Then* apenas o denominador diminui.
- **CA-43** *Given* um checklist com itens, *When* ele é excluído, *Then* seus itens deixam de contar no progresso do card. Se não restarem itens em nenhum checklist, o progresso deixa de ser exibido.
- **CA-44** *Given* o formulário de checklist ou de item, *When* o texto está vazio ou só com espaços, *Then* a gravação é recusada. O título do checklist e o texto do item têm no máximo 200 caracteres.
- **CA-45** *Given* um item feito, *When* o usuário o desmarca, *Then* ele volta a contar como não feito.

### 2.6 Membros e atribuição

- **CA-46** *Given* o administrador de Q e uma conta existente `bia@exemplo.com`, *When* ele a convida com o papel Membro, *Then* Bia passa a ver Q em sua lista com o papel Membro e aparece na lista de membros.
- **CA-47** *Given* o administrador de Q, *When* convida um e-mail sem conta cadastrada, *Then* o convite é recusado, informando que não existe usuário com esse e-mail, e nada é criado.
- **CA-48** *Given* Bia já é membro de Q, *When* o administrador a convida de novo, *Then* a ação é recusada indicando que ela já é membro, sem alterar o papel atual.
- **CA-49** *Given* o administrador de Q, *When* altera o papel de Bia de Membro para Observador, *Then* Bia perde as permissões de edição imediatamente, mas continua vendo Q.
- **CA-50** *Given* Bia, membro de Q e responsável por dois cards, *When* o administrador a remove, *Then* Q some da lista de Bia, ela deixa de ser responsável por esses cards, e os comentários que escreveu permanecem com a sua autoria.
- **CA-51** *Given* Q tem um único Administrador, *When* alguém tenta rebaixá-lo, removê-lo, ou ele tenta deixar o quadro, *Then* a ação é recusada com a explicação de que o quadro precisa ter ao menos um Administrador.
- **CA-52** *Given* Q tem dois Administradores, *When* um deles deixa o quadro, *Then* a ação é aceita e o outro permanece como Administrador.
- **CA-53** *Given* um Membro ou Observador, *When* tenta convidar, alterar papel ou remover outro membro (inclusive por requisição direta), *Then* a ação é recusada por falta de permissão. Ele vê a lista de membros, mas não as ações de gestão.
- **CA-54** *Given* um card em Q, *When* um Administrador ou Membro atribui Bia (membro de Q), *Then* Bia aparece como responsável no card.
- **CA-55** *Given* um card, *When* se tenta atribuir uma pessoa que não é membro de Q, *Then* a ação é recusada.
- **CA-56** *Given* um card com dois responsáveis, *When* um deles é removido da atribuição, *Then* apenas o outro permanece.
- **CA-57** *Given* um Membro (não administrador) que deixa o quadro por conta própria, *When* confirma, *Then* perde o acesso, deixa de ser responsável pelos cards e seus comentários permanecem.

### 2.7 Etiquetas e filtro

- **CA-58** *Given* um Administrador ou Membro, *When* cria a etiqueta "Urgente" com a cor vermelha, *Then* ela fica disponível para os cards do quadro.
- **CA-59** *Given* a etiqueta "Urgente" já existe em Q, *When* se cria outra chamada "urgente" (ou "URGENTE") em Q, *Then* a criação é recusada indicando duplicidade. Em outro quadro, o mesmo nome é permitido.
- **CA-60** *Given* o formulário de etiqueta, *When* o nome está vazio, só com espaços, ou excede 30 caracteres, ou a cor não é uma das oferecidas, *Then* a gravação é recusada.
- **CA-61** *Given* um card, *When* se aplicam as etiquetas "Urgente" e "Backend", *Then* ambas aparecem no card, com seus nomes e cores. *When* se remove "Urgente", *Then* só "Backend" permanece.
- **CA-62** *Given* uma etiqueta usada em 5 cards, *When* é renomeada ou muda de cor, *Then* os 5 cards passam a exibir o novo nome e cor.
- **CA-63** *Given* uma etiqueta usada em 5 cards, *When* um Administrador ou Membro a exclui após confirmação, *Then* a etiqueta é removida desses 5 cards, e os cards em si permanecem.
- **CA-64** *Given* cards com as etiquetas {X}, {Y}, {X, Y} e sem etiqueta, *When* o usuário filtra por X, *Then* vê os cards {X} e {X, Y}. *When* filtra por X e Y, *Then* vê {X}, {Y} e {X, Y}. *When* limpa o filtro, *Then* vê todos.
- **CA-65** *Given* um filtro ativo, *Then* as listas continuam visíveis na mesma ordem, mesmo as que ficam sem cards visíveis, e é possível identificar que o filtro está ativo.
- **CA-66** *Given* um filtro ativo em que nenhum card corresponde, *Then* o sistema informa que nenhum card corresponde ao filtro, sem tratar como erro.
- **CA-67** *Given* o usuário A com filtro ativo, *Then* o usuário B, no mesmo quadro, continua vendo todos os cards.
- **CA-68** *Given* um Observador, *When* usa o filtro, *Then* funciona normalmente, mas ele não pode criar, editar nem excluir etiquetas, nem aplicá-las a cards.

### 2.8 Comentários

- **CA-69** *Given* um Administrador ou Membro em um card, *When* publica um comentário com texto válido, *Then* ele aparece no histórico do card, com o texto, o nome do autor e a data e hora, ao final da lista.
- **CA-70** *Given* um card com 3 comentários, *Then* o histórico os exibe do mais antigo para o mais recente, e todos os membros do quadro veem a mesma sequência.
- **CA-71** *Given* o formulário de comentário, *When* o texto está vazio, só com espaços, ou excede 2.000 caracteres, *Then* o comentário é recusado e o texto digitado é preservado.
- **CA-72** *Given* um Observador, *When* abre o histórico de um card, *Then* vê os comentários, mas não pode publicar.
- **CA-73** *Given* um comentário publicado, *Then* não há ação para editá-lo ou excluí-lo individualmente. Ele só deixa de existir se o card for excluído.

### 2.9 Prazos

- **CA-74** *Given* um card sem prazo, *When* um Administrador ou Membro define o prazo para uma data futura, *Then* o prazo é exibido no card e o card não é marcado como atrasado.
- **CA-75** *Given* um card não concluído com prazo igual a Hoje, *Then* não está atrasado.
- **CA-76** *Given* um card não concluído com prazo anterior a Hoje, *Then* é exibido como atrasado, na lista e nos detalhes, de forma distinguível dos cards em dia.
- **CA-77** *Given* um card atrasado, *When* é marcado como concluído, *Then* deixa de ser exibido como atrasado, e o prazo continua visível. *When* é reaberto e o prazo ainda é anterior a Hoje, *Then* volta a ser exibido como atrasado.
- **CA-78** *Given* um card atrasado, *When* o prazo é alterado para Hoje ou data futura, ou é removido, *Then* deixa de estar atrasado.
- **CA-79** *Given* um card sem prazo, *Then* nunca é considerado atrasado.
- **CA-80** *Given* um card com prazo na véspera de Hoje, *When* a data vira (o dia seguinte começa), *Then* o card passa a ser exibido como atrasado na próxima visualização ou atualização, sem intervenção de ninguém.
- **CA-81** *Given* um quadro com cards atrasados e em dia, *When* o usuário ativa o filtro de atrasados, *Then* vê apenas os atrasados. *When* combina com o filtro de etiqueta "X", *Then* vê apenas os cards que são atrasados **e** têm a etiqueta X.
- **CA-82** *Given* uma data de prazo inválida (que não existe no calendário ou em formato irreconhecível), *When* se tenta gravar, *Then* a gravação é recusada indicando o motivo.

## 3. Regras de negócio e restrições

### 3.1 Conta e sessão

- **RN-01** O e-mail identifica a conta de forma única. A comparação ignora diferenças de maiúsculas e minúsculas e espaços nas extremidades.
- **RN-02** Nome: de 1 a 80 caracteres. Senha: no mínimo 8 caracteres. E-mail: formato válido.
- **RN-03** A senha nunca é exibida de volta ao usuário em nenhuma tela ou resposta.
- **RN-04** A sessão mantém o usuário autenticado por 7 dias a partir do login. O logout encerra a sessão imediatamente.
- **RN-05** As mensagens de falha de login não distinguem e-mail inexistente de senha incorreta.

### 3.2 Papéis e permissões

- **RN-06** Todo quadro tem sempre ao menos um Administrador. O criador começa como Administrador.
- **RN-07** Matriz de permissões:

| Ação | Administrador | Membro | Observador |
|---|---|---|---|
| Ver quadro, listas, cards, comentários, membros | Sim | Sim | Sim |
| Usar filtros de visualização | Sim | Sim | Sim |
| Renomear e excluir o quadro | Sim | Não | Não |
| Convidar, alterar papel e remover membros | Sim | Não | Não |
| Deixar o quadro | Sim (exceto o único Administrador) | Sim | Sim |
| Criar, renomear, reordenar e excluir listas | Sim | Sim | Não |
| Criar, editar, mover, excluir cards; marcar concluído | Sim | Sim | Não |
| Checklists e itens | Sim | Sim | Não |
| Atribuir e remover responsáveis | Sim | Sim | Não |
| Criar, editar, excluir e aplicar etiquetas | Sim | Sim | Não |
| Definir e remover prazo | Sim | Sim | Não |
| Publicar comentários | Sim | Sim | Não |

- **RN-08** As permissões valem para qualquer forma de acesso ao sistema e não apenas para o que a interface mostra. Uma ação não permitida é recusada mesmo se solicitada diretamente.
- **RN-09** A mudança de papel ou a remoção de um membro vale a partir da sua próxima ação, e não apenas no próximo login.
- **RN-10** Um usuário só tem acesso a quadros de que é membro. Para quem não é membro, um quadro existente e um quadro inexistente são indistinguíveis.

### 3.3 Quadros, listas e cards

- **RN-11** Nome de quadro: 1 a 100 caracteres. Nome de lista: 1 a 100 caracteres. Título de card: 1 a 200 caracteres. Descrição de card: até 5.000 caracteres, opcional.
- **RN-12** Nomes de quadro e de lista podem se repetir. Não há restrição de unicidade.
- **RN-13** As listas têm uma ordem total no quadro, e os cards têm uma ordem total dentro da lista. Qualquer mudança (criar, mover, excluir) mantém a ordem consistente, sem posições duplicadas nem lacunas visíveis.
- **RN-14** Um card pertence a exatamente uma lista. Só pode ser movido para listas do mesmo quadro.
- **RN-15** A exclusão de um quadro é definitiva e remove, em cascata, listas, cards, checklists, itens, etiquetas, comentários, atribuições e vínculos de membros.
- **RN-16** A exclusão de uma lista com cards nunca descarta cards sem uma escolha explícita do usuário (CA-22 a CA-26). Ao mover cards na exclusão da lista, nenhum dado do card se perde.
- **RN-17** A exclusão de um card remove tudo o que lhe pertence (checklists, itens, comentários, atribuições, vínculos com etiquetas), mas não as etiquetas do quadro.
- **RN-18** A ordem de quadros na lista do usuário é pela data de criação, do mais recente para o mais antigo.

### 3.4 Checklists

- **RN-19** Um card pode ter vários checklists. Título de checklist e texto de item: 1 a 200 caracteres.
- **RN-20** Progresso do card = itens feitos ÷ total de itens, somando todos os seus checklists. O percentual é arredondado para o inteiro mais próximo. Sem itens, não há progresso (não é 0% nem 100%).

### 3.5 Membros e atribuição

- **RN-21** Só é possível convidar contas já cadastradas, e a entrada no quadro é imediata. Não existem convites pendentes.
- **RN-22** Uma pessoa tem no máximo um papel por quadro.
- **RN-23** Um card só pode ter como responsáveis membros do seu quadro. Um card pode ter vários responsáveis, e um membro pode ser responsável por vários cards.
- **RN-24** Quando um membro sai ou é removido, suas atribuições em cards daquele quadro são removidas e seus comentários permanecem com a autoria preservada.
- **RN-25** Qualquer membro, inclusive Observador, pode ser atribuído a cards.

### 3.6 Etiquetas e filtros

- **RN-26** Etiquetas pertencem a um quadro e só podem ser aplicadas a cards desse quadro. Nome de 1 a 30 caracteres, único dentro do quadro sem diferenciar maiúsculas de minúsculas. A cor é uma das opções oferecidas pelo sistema (conjunto fixo e finito).
- **RN-27** Regras de filtro: dentro do filtro de etiquetas, vale "ao menos uma das selecionadas" (OU). Entre tipos de filtro diferentes (etiquetas e atrasados), vale "todos" (E). Sem filtro ativo, todos os cards são exibidos.
- **RN-28** O filtro é uma preferência de visualização individual, não é gravada no quadro e não afeta outros usuários.

### 3.7 Comentários

- **RN-29** Comentário: de 1 a 2.000 caracteres. Imutável após publicado (sem edição nem exclusão individual). Registra autor e data e hora de publicação.
- **RN-30** Os comentários são exibidos em ordem cronológica crescente.

### 3.8 Prazos

- **RN-31** O prazo é uma data sem horário. Pode ser no passado.
- **RN-32** Atrasado = (tem prazo) E (prazo < Hoje) E (não concluído). Um card com prazo igual a Hoje não está atrasado.
- **RN-33** "Concluído" é uma marcação do próprio card. Mover o card entre listas não altera esse estado.

## 4. Casos de borda e condições de erro

### 4.1 Gerais

- **CB-01** **Entradas só com espaços**: tratadas como vazias (seção 0). Vale para todos os campos de texto.
- **CB-02** **Texto acima do limite**: a gravação é recusada com mensagem indicando o limite. O sistema não trunca silenciosamente.
- **CB-03** **Erro de validação**: o usuário recebe uma mensagem clara sobre o que corrigir, e o que foi digitado é preservado. Nada é gravado parcialmente.
- **CB-04** **Conteúdo com caracteres especiais** (acentos, emojis, aspas, marcas de HTML): é exibido exatamente como digitado, nunca interpretado como marcação nem executado.
- **CB-05** **Sessão expirada no meio de uma ação**: a ação não é executada, o usuário é levado ao login, e após autenticar-se volta ao ponto em que estava.
- **CB-06** **Falha de comunicação** ao salvar uma ação: o usuário é informado de que a ação não foi concluída, e a tela não exibe a mudança como se tivesse sido salva.
- **CB-07** **Recurso inexistente** (por exemplo, abrir um card que foi excluído): o usuário vê uma mensagem de "não encontrado" e é levado a um lugar válido, como o quadro ou a lista de quadros.

### 4.2 Concorrência entre membros

- **CB-08** **Card excluído por outra pessoa enquanto alguém o edita, move, comenta ou altera o checklist**: a ação é recusada com a informação de que o card não existe mais. Não há criação de dados órfãos.
- **CB-09** **Lista excluída por outra pessoa enquanto alguém move um card para ela ou cria um card nela**: a ação é recusada com a informação de que a lista não existe mais, e o card não é perdido: permanece onde estava.
- **CB-10** **Dois usuários editando o mesmo campo ao mesmo tempo**: vale a última gravação, sem erro. Nenhuma das duas gravações deixa o dado em estado inválido.
- **CB-11** **Dois usuários movendo cards na mesma lista ao mesmo tempo**: o resultado final tem uma ordem consistente (sem duplicatas nem cards perdidos), ainda que não seja exatamente a que um deles esperava. Ao recarregar, todos veem a mesma ordem.
- **CB-12** **Papel alterado ou membro removido durante uma ação**: a ação é avaliada com o papel vigente no momento de ser executada (RN-09). Se já não for permitida, é recusada.
- **CB-13** **Membro removido que está com o quadro aberto**: na próxima ação ou atualização, perde o acesso e é levado à lista de quadros com uma mensagem.

### 4.3 Quadros e listas

- **CB-14** **Quadro sem listas**: é um estado válido e exibe um convite para criar a primeira lista.
- **CB-15** **Lista sem cards**: é um estado válido e continua aceitando cards e a chegada de cards movidos.
- **CB-16** **Mover lista ou card para a mesma posição em que já está**: não gera erro nem altera nada.
- **CB-17** **Posição de destino além do fim da lista**: o card é colocado no final.
- **CB-18** **Mover card para lista de outro quadro**: não é possível e é recusado.
- **CB-19** **Exclusão da última lista do quadro**: permitida. O quadro passa a ter zero listas (CB-14). Se ela tiver cards, aplica-se o CA-26.
- **CB-20** **Exclusão de lista com mover para lista de destino que foi excluída entre o diálogo e a confirmação**: a ação é recusada e o usuário é informado, sem excluir nada.
- **CB-21** **Exclusão de quadro por Administrador enquanto outros membros o usam**: os demais perdem o acesso, e a próxima ação deles é tratada conforme CB-07.

### 4.4 Cards, checklists e comentários

- **CB-22** **Card sem descrição, sem checklist, sem etiqueta, sem responsável, sem prazo, sem comentário**: é um estado válido e cada uma dessas seções exibe seu estado vazio.
- **CB-23** **Card concluído sem prazo, ou com prazo futuro**: sem efeito sobre o atraso, e nenhum erro.
- **CB-24** **Todos os itens feitos mas o card não está concluído**: o progresso é 100%, mas o card **não** passa a concluído automaticamente. As duas noções são independentes.
- **CB-25** **Item de checklist marcado por dois usuários ao mesmo tempo**: o resultado final é um estado definido (feito ou não feito) e o progresso é coerente com ele.
- **CB-26** **Comentário duplicado enviado por duplo clique**: o usuário que clica uma vez não deve ter dois comentários idênticos criados por esse clique único. Comentários idênticos intencionais, em momentos distintos, são permitidos.

### 4.5 Membros

- **CB-27** **Convite com e-mail em outra caixa (`BIA@...`)**: reconhece a mesma conta (RN-01).
- **CB-28** **Convite com e-mail de formato inválido**: recusado como erro de validação, distinto do "usuário não encontrado".
- **CB-29** **Administrador convida a si mesmo**: recusado, pois já é membro (CA-48).
- **CB-30** **Administrador tenta alterar o próprio papel**: permitido apenas se restar ao menos outro Administrador (CA-51).
- **CB-31** **Único membro do quadro é o Administrador e quer sair**: recusado (CA-51). Para encerrar o quadro, deve excluí-lo.
- **CB-32** **Pessoa removida e depois convidada de novo**: volta como membro com o papel do novo convite. As atribuições anteriores **não** são restauradas, e seus comentários antigos continuam com a sua autoria.

### 4.6 Etiquetas e filtros

- **CB-33** **Etiqueta excluída enquanto um filtro por ela está ativo**: o filtro deixa de considerá-la. Se era a única selecionada, o filtro se comporta como limpo.
- **CB-34** **Filtro por etiquetas e o card muda de etiquetas por outra pessoa**: o card entra ou sai do resultado conforme as etiquetas atuais, na próxima atualização da tela.
- **CB-35** **Nenhuma etiqueta criada no quadro**: o filtro por etiquetas informa que não há etiquetas, sem erro.

### 4.7 Prazos

- **CB-36** **Fuso horário**: "Hoje" depende do fuso do usuário que visualiza. Dois membros em fusos diferentes podem, perto da virada do dia, discordar momentaneamente sobre um card estar atrasado. Isso é esperado e não é erro.
- **CB-37** **Prazo em 29 de fevereiro**: aceito apenas em anos bissextos. Em outros anos, é data inválida (CA-82).
- **CB-38** **Prazo muito distante** (por exemplo, ano 9999): se for uma data de calendário válida, é aceito.

## 5. Fora de escopo

Para evitar ambiguidade, **não** fazem parte desta especificação:

- Recuperação ou troca de senha, confirmação de e-mail, edição de dados da conta, exclusão de conta.
- Login com provedores externos e autenticação em dois fatores.
- Convites por e-mail para pessoas sem conta, links de convite, e fluxo de aceite ou recusa de convite.
- Edição ou exclusão individual de comentários, menções e respostas encadeadas.
- Anexos, imagens e formatação de texto rica em cards.
- Notificações (por e-mail ou no sistema) de prazos, atribuições ou comentários.
- Reordenação de itens dentro de um checklist, e conversão de item em card.
- Arquivamento ou restauração de quadros, listas ou cards excluídos (a exclusão é definitiva).
- Duplicação de quadros, listas ou cards.
- Busca textual de cards, e filtros por responsável, que não sejam os descritos aqui.
- Histórico de atividades além dos comentários.
- Atualização em tempo real sem ação do usuário. As mudanças de outros membros são vistas na próxima atualização da tela.

## 6. Interpretações adotadas

Pontos em que o pedido admitia mais de uma leitura e esta especificação fixou uma interpretação. Podem ser revistos antes de seguir para as próximas fases.

1. **Papéis**: três papéis (Administrador, Membro, Observador). O pedido citava "papéis diferentes" sem defini-los.
2. **Convite**: apenas para contas existentes e sem etapa de aceite (RN-21).
3. **Exclusão de lista com cards**: o usuário escolhe entre mover os cards para outra lista ou excluí-los junto, com confirmação (RF-14).
4. **Marcação "concluído"**: introduzida porque, sem ela, não haveria como um card com prazo vencido deixar de ser considerado atrasado (RF-20, RN-32).
5. **Prazo**: data sem horário. Atrasado é a partir do dia seguinte ao prazo (RN-31, RN-32).
6. **Filtro de etiquetas**: combinação "ao menos uma" (OU) (RN-27).
7. **Comentários**: imutáveis, sem edição nem exclusão (RN-29).
8. **Observador pode ser responsável por cards** (RN-25).
9. **Sessão**: 7 dias a partir do login (RN-04).
10. **Quem edita estrutura do quadro**: listas, etiquetas e cards são editáveis por Administradores e Membros. Apenas o Administrador gerencia o quadro em si e seus membros (RN-07).
