# Especificação Funcional — Gerenciador de Quadros de Tarefas

Esta especificação descreve **o que** o sistema deve fazer, do ponto de vista do usuário. Não prescreve tecnologia, arquitetura ou implementação.

---

## 1. Escopo e glossário

### 1.1 Escopo

O sistema permite que usuários cadastrados organizem trabalho em **quadros**, compostos por **listas**, que contêm **cards**. Os cards podem ter checklists, etiquetas, responsáveis, comentários e prazo. Um quadro pode ser compartilhado com outros usuários, cada um com um papel.

### 1.2 Fora de escopo

Não fazem parte desta especificação: recuperação/redefinição de senha, verificação de e-mail, exclusão de conta, edição de perfil, notificações (e-mail ou push), anexos, arquivamento/restauração de itens excluídos, edição ou exclusão de comentários, colaboração em tempo real e convites para pessoas sem conta.

### 1.3 Glossário

| Termo | Significado |
|---|---|
| Usuário | Pessoa com conta cadastrada. |
| Quadro | Espaço de trabalho com nome e descrição opcional, contendo listas e membros. |
| Lista | Coluna nomeada dentro de um quadro, que contém cards em ordem. |
| Card | Unidade de trabalho dentro de uma lista. |
| Checklist | Conjunto nomeado de itens marcáveis dentro de um card. |
| Etiqueta | Marcador com nome e cor, pertencente a um quadro e aplicável aos cards desse quadro. |
| Membro | Usuário com acesso a um quadro, com um papel (Administrador, Colaborador ou Observador). |
| Responsável | Membro atribuído a um card. |
| Prazo | Data (sem hora) até a qual o card deve ser concluído. |
| Atrasado | Card com prazo anterior ao dia atual e que não está marcado como concluído. |
| Dia atual | Data de hoje no fuso horário do usuário que está visualizando. |

---

## 2. Papéis e permissões

Existem três papéis **por quadro**. O usuário que cria um quadro torna-se seu **Administrador**. Um mesmo usuário pode ter papéis diferentes em quadros diferentes.

| Ação | Administrador | Colaborador | Observador |
|---|:-:|:-:|:-:|
| Ver quadro, listas, cards, comentários, membros | ✔ | ✔ | ✔ |
| Filtrar cards por etiqueta | ✔ | ✔ | ✔ |
| Editar nome/descrição do quadro | ✔ | ✘ | ✘ |
| Excluir o quadro | ✔ | ✘ | ✘ |
| Convidar membros, alterar papéis, remover membros | ✔ | ✘ | ✘ |
| Criar, renomear, reordenar, excluir listas | ✔ | ✔ | ✘ |
| Criar, editar, mover, excluir cards (incl. prazo e conclusão) | ✔ | ✔ | ✘ |
| Gerenciar checklists e itens | ✔ | ✔ | ✘ |
| Criar/editar/excluir etiquetas e aplicá-las a cards | ✔ | ✔ | ✘ |
| Atribuir/remover responsáveis em cards | ✔ | ✔ | ✘ |
| Comentar em cards | ✔ | ✔ | ✘ |

---

## 3. Comportamento esperado

### 3.1 Conta e sessão

- **C1.** O visitante pode se cadastrar informando nome, e-mail e senha. Após o cadastro bem-sucedido, o usuário já fica autenticado.
- **C2.** O visitante cadastrado pode fazer login com e-mail e senha.
- **C3.** O usuário autenticado permanece autenticado ao fechar e reabrir o navegador, sem precisar informar as credenciais novamente, até que faça logout ou a sessão expire por inatividade (ver RN-A4).
- **C4.** O usuário autenticado pode encerrar a sessão (logout). Após o logout, o acesso a áreas protegidas exige novo login.
- **C5.** Visitantes não autenticados que tentarem acessar áreas protegidas são direcionados ao login; após logar, chegam ao destino pretendido.

### 3.2 Quadros

- **Q1.** O usuário vê a lista dos quadros em que é membro (criados por ele ou aos quais foi convidado), indicando o papel que tem em cada um.
- **Q2.** O usuário cria um quadro informando nome (obrigatório) e descrição (opcional). Torna-se Administrador dele.
- **Q3.** O usuário abre um quadro e vê suas listas, na ordem, com os respectivos cards na ordem.
- **Q4.** O Administrador edita nome e descrição do quadro.
- **Q5.** O Administrador exclui o quadro após confirmação explícita. A exclusão remove permanentemente listas, cards, checklists, etiquetas, comentários e vínculos de membros do quadro.

### 3.3 Listas

- **L1.** Colaborador ou Administrador cria uma lista em um quadro; ela é adicionada ao final.
- **L2.** Pode renomear uma lista.
- **L3.** Pode reordenar listas dentro do quadro; a nova ordem persiste e é a mesma para todos os membros.
- **L4.** Pode excluir uma lista.
  - Lista **vazia**: é excluída diretamente.
  - Lista **com cards**: o sistema informa a quantidade de cards que serão afetados e exige confirmação explícita. Confirmada, a lista **e todos os seus cards** (com checklists, comentários, atribuições e prazos) são excluídos permanentemente. Cancelada, nada muda.

### 3.4 Cards

- **K1.** Cria um card em uma lista informando título (obrigatório); é adicionado ao final da lista.
- **K2.** Edita título, descrição (opcional) e prazo (opcional) de um card.
- **K3.** Move um card para outra lista do **mesmo quadro**, em uma posição escolhida, e reordena cards dentro da mesma lista. A ordem resultante persiste e é visível a todos os membros.
- **K4.** Exclui um card, com confirmação. A exclusão remove checklists, comentários, atribuições e vínculos com etiquetas do card.
- **K5.** Marca ou desmarca um card como **concluído**.
- **K6.** Ao abrir um card, vê todos os seus dados: título, descrição, lista atual, prazo, estado de conclusão, checklists e progresso, etiquetas, responsáveis e histórico de comentários.

### 3.5 Checklists

- **CK1.** Um card pode ter zero ou mais checklists, cada uma com título.
- **CK2.** Em cada checklist é possível criar, editar o texto, marcar/desmarcar e excluir itens, além de renomear e excluir a checklist.
- **CK3.** O **progresso** do card é a razão entre itens marcados e total de itens (somando todas as checklists do card), exibido como "X/Y" e percentual inteiro arredondado para baixo. Cada checklist também exibe seu próprio progresso. Sem itens, exibe-se "sem itens" em vez de percentual.
- **CK4.** O progresso aparece também na visão do card dentro da lista (sem precisar abrir o card).
- **CK5.** Marcar todos os itens **não** conclui o card automaticamente; a conclusão é uma ação separada (K5).

### 3.6 Membros e papéis

- **M1.** O Administrador convida um usuário informando o e-mail de uma conta existente e escolhendo um papel. O usuário é adicionado imediatamente, sem etapa de aceite, e passa a ver o quadro em sua lista.
- **M2.** O Administrador altera o papel de qualquer membro e remove membros.
- **M3.** Todos os membros veem a lista de membros e seus papéis.
- **M4.** Responsáveis: Colaborador ou Administrador atribui a um card um ou mais membros do quadro, e pode removê-los. Os responsáveis aparecem no card e na visão do card dentro da lista.
- **M5.** Ao remover um membro, ele perde o acesso ao quadro imediatamente e suas atribuições em cards desse quadro são removidas. Comentários que ele escreveu permanecem, mantendo o nome do autor.

### 3.7 Etiquetas e filtro

- **E1.** Colaborador ou Administrador cria etiquetas em um quadro, com nome e uma cor escolhida de uma paleta fixa de pelo menos 8 cores.
- **E2.** Pode editar nome/cor de uma etiqueta e excluí-la. Excluir uma etiqueta a remove de todos os cards.
- **E3.** Pode aplicar e remover etiquetas de um card (zero ou mais por card). Etiquetas aparecem no card dentro da lista.
- **E4.** Qualquer membro pode **filtrar** os cards do quadro selecionando uma ou mais etiquetas. O quadro passa a exibir apenas os cards que possuem **pelo menos uma** das etiquetas selecionadas. As listas continuam visíveis, mesmo sem cards correspondentes. Limpar o filtro restaura a visão completa. O filtro afeta apenas a visualização de quem o aplica; não altera dados nem a visão de outros membros.

### 3.8 Comentários

- **CM1.** Colaborador ou Administrador adiciona um comentário (texto) a um card.
- **CM2.** O card exibe o histórico de comentários em ordem cronológica (mais antigo primeiro), cada um com nome do autor, data e hora.
- **CM3.** Comentários não podem ser editados nem excluídos individualmente; só deixam de existir com a exclusão do card (ou de lista/quadro que o contenha).

### 3.9 Prazos e atraso

- **P1.** Um card pode ter um prazo (data) definido, alterado ou removido.
- **P2.** Um card é **atrasado** quando tem prazo, o prazo é anterior ao dia atual e o card não está concluído. Um card com prazo igual ao dia atual **não** está atrasado.
- **P3.** Cards atrasados são visualmente identificados, tanto na visão do card dentro da lista quanto no card aberto, e distinguíveis de cards com prazo no futuro e de cards concluídos.
- **P4.** O quadro informa quantos cards atrasados ele possui e permite ver quais são.

---

## 4. Critérios de aceite (Given / When / Then)

### 4.1 Conta e sessão

- **CA-C1** — *Cadastro válido.* **Given** um visitante sem conta, **When** informa nome, e-mail válido não cadastrado e senha com 8 ou mais caracteres, **Then** a conta é criada, ele fica autenticado e vê a lista de quadros (vazia).
- **CA-C2** — *E-mail duplicado.* **Given** já existe conta com `ana@ex.com`, **When** alguém tenta cadastrar `ANA@ex.com`, **Then** o cadastro é recusado com mensagem informando que o e-mail já está em uso, e nenhuma conta é criada.
- **CA-C3** — *Dados inválidos.* **Given** um visitante no cadastro, **When** envia nome vazio, e-mail com formato inválido ou senha com menos de 8 caracteres, **Then** o cadastro é recusado e a mensagem indica qual campo está inválido.
- **CA-C4** — *Login válido.* **Given** conta existente, **When** informa e-mail e senha corretos, **Then** fica autenticado e vê seus quadros.
- **CA-C5** — *Login inválido.* **Given** conta existente, **When** informa senha errada ou e-mail inexistente, **Then** o login é recusado com a mesma mensagem genérica nos dois casos ("e-mail ou senha inválidos"), sem revelar qual dos dois está incorreto.
- **CA-C6** — *Persistência.* **Given** usuário autenticado, **When** fecha e reabre o navegador dentro do período de validade da sessão, **Then** continua autenticado e sem passar pelo login.
- **CA-C7** — *Expiração.* **Given** usuário sem atividade além do período de validade da sessão, **When** tenta acessar uma área protegida, **Then** é direcionado ao login.
- **CA-C8** — *Logout.* **Given** usuário autenticado, **When** faz logout, **Then** é direcionado ao login e, ao tentar voltar a uma área protegida (inclusive pelo botão "voltar"), é novamente direcionado ao login.
- **CA-C9** — *Rota protegida.* **Given** visitante não autenticado, **When** acessa o endereço de um quadro, **Then** é direcionado ao login e, após autenticar-se com sucesso e sendo membro, vê esse quadro.

### 4.2 Quadros

- **CA-Q1** — *Criar.* **Given** usuário autenticado, **When** cria um quadro com nome "Sprint 1", **Then** o quadro aparece em sua lista com papel Administrador e sem listas.
- **CA-Q2** — *Nome obrigatório.* **Given** o formulário de novo quadro, **When** o nome está vazio ou só com espaços, **Then** a criação é recusada com mensagem de campo obrigatório.
- **CA-Q3** — *Isolamento.* **Given** quadros de Ana em que Bruno não é membro, **When** Bruno lista seus quadros ou tenta abrir diretamente o endereço de um quadro de Ana, **Then** não os vê na lista e a tentativa de abrir é tratada como "quadro não encontrado".
- **CA-Q4** — *Editar.* **Given** Administrador, **When** altera nome e descrição, **Then** os novos valores são exibidos para todos os membros.
- **CA-Q5** — *Editar sem permissão.* **Given** Colaborador ou Observador, **When** tenta editar ou excluir o quadro, **Then** a ação não é oferecida na interface e, se forçada, é recusada com mensagem de permissão insuficiente, sem alterar dados.
- **CA-Q6** — *Excluir.* **Given** Administrador de um quadro com listas e cards, **When** confirma a exclusão, **Then** o quadro desaparece da lista de todos os membros e seu conteúdo deixa de existir.
- **CA-Q7** — *Cancelar exclusão.* **Given** o diálogo de confirmação aberto, **When** o Administrador cancela, **Then** nada é excluído.

### 4.3 Listas

- **CA-L1** — *Criar.* **Given** quadro com 2 listas, **When** um Colaborador cria a lista "Revisão", **Then** ela aparece como terceira lista.
- **CA-L2** — *Nome inválido.* **Given** criação ou renomeação de lista, **When** o nome está vazio/só espaços ou excede 100 caracteres, **Then** a ação é recusada com mensagem e nada muda.
- **CA-L3** — *Renomear.* **Given** lista "A fazer", **When** é renomeada para "Backlog", **Then** o novo nome é exibido a todos e os cards permanecem nela.
- **CA-L4** — *Reordenar.* **Given** listas [A, B, C], **When** C é movida para a primeira posição, **Then** a ordem passa a ser [C, A, B] e permanece assim após recarregar a página e para outros membros.
- **CA-L5** — *Excluir lista vazia.* **Given** lista sem cards, **When** o usuário solicita a exclusão, **Then** a lista é removida.
- **CA-L6** — *Excluir lista com cards, confirmando.* **Given** lista com 3 cards, **When** o usuário solicita a exclusão, **Then** o sistema informa que 3 cards serão excluídos junto e pede confirmação; **And When** confirma, **Then** a lista e os 3 cards deixam de existir.
- **CA-L7** — *Excluir lista com cards, cancelando.* **Given** o mesmo cenário, **When** o usuário cancela, **Then** a lista e os cards permanecem inalterados.
- **CA-L8** — *Observador.* **Given** Observador, **When** tenta criar, renomear, reordenar ou excluir lista, **Then** é recusado sem alteração.

### 4.4 Cards

- **CA-K1** — *Criar.* **Given** lista com 2 cards, **When** um Colaborador cria o card "Escrever testes", **Then** ele aparece como último card dessa lista.
- **CA-K2** — *Título obrigatório.* **Given** criação/edição de card, **When** o título está vazio/só espaços ou excede 200 caracteres, **Then** a ação é recusada e nada muda.
- **CA-K3** — *Editar.* **Given** card existente, **When** altera título, descrição e prazo, **Then** os novos valores são exibidos ao reabrir o card e para outros membros.
- **CA-K4** — *Mover entre listas.* **Given** card X na lista A e lista B com 2 cards, **When** X é movido para a posição 2 de B, **Then** X sai de A, aparece em B entre os dois cards existentes e mantém checklists, comentários, etiquetas, responsáveis e prazo.
- **CA-K5** — *Reordenar na mesma lista.* **Given** lista [X, Y, Z], **When** Z é movido para a primeira posição, **Then** a ordem é [Z, X, Y] e persiste após recarregar.
- **CA-K6** — *Mover para lista vazia.* **Given** lista de destino sem cards, **When** um card é movido para ela, **Then** ele passa a ser o único card da lista.
- **CA-K7** — *Mover para outro quadro.* **Given** um card, **When** se tenta movê-lo para uma lista de outro quadro, **Then** a operação é recusada e o card permanece onde estava.
- **CA-K8** — *Excluir.* **Given** card com checklists e comentários, **When** o usuário confirma a exclusão, **Then** o card some da lista e nada dele é recuperável.
- **CA-K9** — *Concluir.* **Given** card não concluído, **When** o usuário o marca como concluído, **Then** o card passa a ser exibido como concluído para todos; desmarcar reverte.
- **CA-K10** — *Observador.* **Given** Observador, **When** tenta criar, editar, mover, excluir ou concluir cards, **Then** é recusado sem alteração.

### 4.5 Checklists e progresso

- **CA-CK1** — *Criar checklist e itens.* **Given** card aberto, **When** o usuário cria a checklist "Entrega" com 4 itens, **Then** a checklist e os itens aparecem em ordem de criação, todos desmarcados, com progresso 0/4 (0%).
- **CA-CK2** — *Marcar item.* **Given** checklist com 4 itens, **When** 1 é marcado, **Then** o progresso mostra 1/4 (25%) no card aberto e na visão do card na lista.
- **CA-CK3** — *Desmarcar item.* **Given** progresso 1/4, **When** o item é desmarcado, **Then** o progresso volta a 0/4 (0%).
- **CA-CK4** — *Progresso agregado.* **Given** checklist A com 2 itens (1 marcado) e B com 3 itens (3 marcados), **When** o card é exibido, **Then** o progresso do card é 4/5 (80%), A mostra 1/2 e B mostra 3/3.
- **CA-CK5** — *Excluir item/checklist.* **Given** progresso 2/4, **When** um item marcado é excluído, **Then** o progresso passa a 1/3 (33%); **And When** a checklist inteira é excluída, **Then** seus itens saem do cálculo do card.
- **CA-CK6** — *Sem itens.* **Given** card sem itens de checklist (sem checklist, ou checklists vazias), **When** exibido, **Then** mostra "sem itens" e não exibe percentual.
- **CA-CK7** — *Não conclui automaticamente.* **Given** todos os itens marcados, **When** o card é exibido, **Then** progresso é 100% e o card continua não concluído até que o usuário o marque (K5).
- **CA-CK8** — *Texto inválido.* **Given** criação/edição de item ou checklist, **When** o texto está vazio/só espaços ou excede 200 caracteres, **Then** é recusado sem alteração.

### 4.6 Membros, papéis e responsáveis

- **CA-M1** — *Convidar.* **Given** Administrador e uma conta `bia@ex.com`, **When** convida `bia@ex.com` como Colaborador, **Then** Bia passa a ver o quadro em sua lista com papel Colaborador e aparece na lista de membros.
- **CA-M2** — *E-mail sem conta.* **Given** Administrador, **When** convida um e-mail sem conta, **Then** o convite é recusado com mensagem informando que não há usuário com esse e-mail.
- **CA-M3** — *Já membro.* **Given** Bia já é membro, **When** o Administrador a convida de novo (ou convida a si mesmo), **Then** é recusado com mensagem de que a pessoa já é membro.
- **CA-M4** — *Alterar papel.* **Given** Bia é Colaboradora, **When** o Administrador a torna Observadora, **Then** Bia perde imediatamente as permissões de edição e mantém as de leitura.
- **CA-M5** — *Último administrador.* **Given** um quadro com um único Administrador, **When** se tenta rebaixá-lo ou removê-lo, **Then** é recusado com mensagem de que o quadro precisa ter ao menos um Administrador.
- **CA-M6** — *Promover.* **Given** Bia Colaboradora, **When** é promovida a Administradora, **Then** passa a poder gerenciar membros, e o quadro tem dois Administradores.
- **CA-M7** — *Gestão sem permissão.* **Given** Colaborador ou Observador, **When** tenta convidar, alterar papel ou remover membros, **Then** é recusado sem alteração.
- **CA-M8** — *Remover membro.* **Given** Bia é membro e responsável por 2 cards, **When** o Administrador a remove, **Then** Bia não vê mais o quadro, deixa de ser responsável pelos 2 cards, e os comentários que escreveu continuam com seu nome.
- **CA-M9** — *Atribuir responsável.* **Given** card e membro Bia, **When** um Colaborador atribui Bia ao card, **Then** Bia aparece como responsável no card aberto e na visão do card na lista; atribuir também a Caio resulta em dois responsáveis.
- **CA-M10** — *Atribuir não-membro.* **Given** um usuário que não é membro do quadro, **When** se tenta atribuí-lo a um card, **Then** é recusado.
- **CA-M11** — *Atribuição repetida.* **Given** Bia já é responsável pelo card, **When** é atribuída de novo, **Then** continua aparecendo uma única vez.
- **CA-M12** — *Remover responsável.* **Given** Bia responsável por um card, **When** a atribuição é removida, **Then** Bia continua membro do quadro, mas não aparece mais como responsável.

### 4.7 Etiquetas e filtro

- **CA-E1** — *Criar etiqueta.* **Given** quadro, **When** um Colaborador cria a etiqueta "Urgente" com cor vermelha, **Then** ela fica disponível para todos os cards do quadro.
- **CA-E2** — *Nome duplicado.* **Given** etiqueta "Urgente" existente, **When** se cria outra "urgente" no mesmo quadro, **Then** é recusado; em outro quadro, é permitido.
- **CA-E3** — *Dados inválidos.* **Given** criação/edição de etiqueta, **When** o nome está vazio/só espaços, excede 30 caracteres, ou a cor não pertence à paleta, **Then** é recusado.
- **CA-E4** — *Aplicar/remover.* **Given** card e etiquetas "Urgente" e "Bug", **When** ambas são aplicadas ao card, **Then** o card exibe as duas; **And When** "Bug" é removida do card, **Then** exibe só "Urgente" e a etiqueta "Bug" continua existindo no quadro.
- **CA-E5** — *Aplicação repetida.* **Given** card com "Urgente", **When** "Urgente" é aplicada de novo, **Then** continua aparecendo uma vez.
- **CA-E6** — *Editar etiqueta.* **Given** etiqueta aplicada a 3 cards, **When** nome ou cor são alterados, **Then** os 3 cards exibem os novos valores.
- **CA-E7** — *Excluir etiqueta.* **Given** etiqueta aplicada a 3 cards, **When** é excluída, **Then** desaparece do quadro e dos 3 cards, que permanecem existindo.
- **CA-E8** — *Filtrar por uma etiqueta.* **Given** 5 cards, 2 com "Urgente", **When** o usuário seleciona "Urgente" no filtro, **Then** apenas esses 2 cards são exibidos nas suas respectivas listas.
- **CA-E9** — *Filtrar por várias.* **Given** cards: P tem só "Urgente", Q tem só "Bug", R tem ambas, S tem nenhuma, **When** o filtro seleciona "Urgente" e "Bug", **Then** são exibidos P, Q e R (pelo menos uma das selecionadas), e S fica oculto.
- **CA-E10** — *Filtro sem resultado.* **Given** filtro ativo sem cards correspondentes, **When** o quadro é exibido, **Then** todas as listas continuam visíveis, vazias, com indicação de que o filtro está ativo e nenhum card corresponde.
- **CA-E11** — *Limpar filtro.* **Given** filtro ativo, **When** o usuário o limpa, **Then** todos os cards voltam a ser exibidos.
- **CA-E12** — *Filtro é pessoal.* **Given** Ana com filtro ativo, **When** Bia abre o mesmo quadro, **Then** Bia vê todos os cards (sem o filtro de Ana).
- **CA-E13** — *Observador filtra.* **Given** Observador, **When** usa o filtro, **Then** funciona normalmente; criar/editar/excluir etiquetas é recusado.

### 4.8 Comentários

- **CA-CM1** — *Comentar.* **Given** Colaborador no card, **When** envia o comentário "Revisei o PR", **Then** o comentário aparece no histórico com seu nome e data/hora de envio.
- **CA-CM2** — *Ordem.* **Given** comentários enviados em T1 < T2 < T3, **When** o card é aberto, **Then** são listados na ordem T1, T2, T3.
- **CA-CM3** — *Texto inválido.* **Given** o campo de comentário, **When** o texto está vazio/só espaços ou excede 2000 caracteres, **Then** é recusado e nenhum comentário é criado.
- **CA-CM4** — *Visibilidade.* **Given** comentários em um card, **When** qualquer membro (inclusive Observador) abre o card, **Then** vê todos os comentários.
- **CA-CM5** — *Observador não comenta.* **Given** Observador, **When** tenta comentar, **Then** é recusado e nenhum comentário é criado.
- **CA-CM6** — *Imutabilidade.* **Given** um comentário existente, **When** o usuário procura editá-lo ou excluí-lo, **Then** essas ações não existem.
- **CA-CM7** — *Cascata.* **Given** card com comentários, **When** o card (ou sua lista, ou seu quadro) é excluído, **Then** os comentários deixam de existir.

### 4.9 Prazos e atraso

Em todos os cenários abaixo, o dia atual é **10/06**.

- **CA-P1** — *Definir prazo.* **Given** card sem prazo, **When** o usuário define 15/06, **Then** o card exibe prazo 15/06 e não é atrasado.
- **CA-P2** — *Atrasado.* **Given** card não concluído com prazo 09/06, **When** é exibido, **Then** é identificado como atrasado, na lista e no card aberto.
- **CA-P3** — *No dia.* **Given** card não concluído com prazo 10/06, **When** é exibido, **Then** **não** é atrasado.
- **CA-P4** — *Virada de dia.* **Given** card com prazo 10/06 não concluído, **When** o dia atual passa a ser 11/06, **Then** o card passa a ser identificado como atrasado sem necessidade de edição.
- **CA-P5** — *Concluído não é atrasado.* **Given** card com prazo 09/06 marcado como concluído, **When** exibido, **Then** não é identificado como atrasado; **And When** é desmarcado como concluído, **Then** volta a ser atrasado.
- **CA-P6** — *Sem prazo.* **Given** card sem prazo, **When** exibido, **Then** nunca é atrasado.
- **CA-P7** — *Alterar/remover prazo.* **Given** card atrasado, **When** o prazo é movido para 12/06 ou removido, **Then** deixa de ser atrasado.
- **CA-P8** — *Resumo do quadro.* **Given** quadro com 3 cards atrasados, **When** exibido, **Then** informa "3 atrasados" e permite identificar quais são.
- **CA-P9** — *Prazo inválido.* **Given** edição de prazo, **When** o valor não é uma data válida (ex.: 31/02), **Then** é recusado e o prazo anterior é mantido.
- **CA-P10** — *Prazo no passado.* **Given** edição de prazo, **When** se define uma data passada, **Then** é aceito e o card é imediatamente identificado como atrasado (se não concluído).
- **CA-P11** — *Mover não afeta atraso.* **Given** card atrasado, **When** é movido de lista, **Then** continua atrasado.

---

## 5. Regras de negócio e restrições

### Autenticação
- **RN-A1.** O e-mail é único no sistema, comparado sem distinção entre maiúsculas e minúsculas e ignorando espaços nas pontas.
- **RN-A2.** Senha: mínimo de 8 caracteres. Nome: 1 a 100 caracteres (após remover espaços das pontas).
- **RN-A3.** A senha nunca é exibida nem devolvida ao usuário em nenhuma tela ou resposta.
- **RN-A4.** A sessão permanece válida enquanto houver atividade, e expira após 30 dias sem uso. Logout a encerra imediatamente.
- **RN-A5.** Mensagens de falha de login não distinguem e-mail inexistente de senha incorreta.

### Acesso e propriedade
- **RN-B1.** Todo conteúdo de um quadro (listas, cards, checklists, etiquetas, comentários, membros) só é acessível a membros daquele quadro. Para quem não é membro, o quadro é tratado como inexistente.
- **RN-B2.** As permissões de cada papel são as da seção 2 e são verificadas em toda ação, independentemente de a interface oferecê-la.
- **RN-B3.** O criador do quadro é seu primeiro Administrador.
- **RN-B4.** Um quadro tem sempre ao menos um Administrador. Rebaixar ou remover o último Administrador é proibido.
- **RN-B5.** Um usuário é membro de um quadro no máximo uma vez, com um único papel.

### Estrutura e ordenação
- **RN-S1.** Listas pertencem a exatamente um quadro; cards a exatamente uma lista; checklists, comentários e atribuições a exatamente um card; etiquetas a exatamente um quadro.
- **RN-S2.** Novas listas entram no fim do quadro; novos cards entram no fim da lista.
- **RN-S3.** A ordem de listas e de cards é persistente e idêntica para todos os membros. Reordenar ou mover um item não altera a ordem relativa dos demais.
- **RN-S4.** Um card só pode ser movido entre listas do mesmo quadro.
- **RN-S5.** Nomes de quadros e listas, e títulos de cards, podem se repetir. Nomes de etiquetas são únicos por quadro (sem distinção de maiúsculas/minúsculas).

### Exclusões em cascata
- **RN-X1.** Excluir quadro remove tudo que ele contém e os vínculos de membros.
- **RN-X2.** Excluir lista remove todos os cards dela e, com eles, tudo o que pertence aos cards. A exclusão de lista com cards exige confirmação explícita que informe a quantidade de cards afetados.
- **RN-X3.** Excluir card remove suas checklists, itens, comentários, atribuições e vínculos com etiquetas.
- **RN-X4.** Excluir etiqueta remove-a dos cards, sem excluí-los.
- **RN-X5.** Excluir checklist remove seus itens; excluir item o remove do cálculo de progresso.
- **RN-X6.** Remover membro remove suas atribuições a cards do quadro, mas preserva os comentários que escreveu (com seu nome).
- **RN-X7.** Toda exclusão é permanente; não há lixeira nem desfazer.
- **RN-X8.** Exclusões de quadro, de lista com cards e de card exigem confirmação explícita do usuário.

### Limites de tamanho (após remover espaços das pontas; texto composto só de espaços é vazio)
| Campo | Limite |
|---|---|
| Nome de quadro | 1–100 |
| Descrição de quadro | 0–500 |
| Nome de lista | 1–100 |
| Título de card | 1–200 |
| Descrição de card | 0–5000 |
| Título de checklist | 1–100 |
| Texto de item de checklist | 1–200 |
| Nome de etiqueta | 1–30 |
| Comentário | 1–2000 |

### Progresso, prazo e conclusão
- **RN-D1.** Progresso do card = itens marcados ÷ total de itens de todas as suas checklists. Percentual inteiro arredondado para baixo. Total zero → "sem itens".
- **RN-D2.** Marcar todos os itens não altera o estado de conclusão do card, e concluir o card não altera os itens.
- **RN-D3.** Prazo é uma data sem horário. "Atrasado" ⇔ prazo definido **e** prazo < dia atual **e** card não concluído. A avaliação é feita sempre no momento da exibição, usando o dia atual no fuso horário de quem visualiza.
- **RN-D4.** O prazo pode ser definido para qualquer data válida, inclusive no passado.

### Etiquetas, filtro e comentários
- **RN-F1.** Uma etiqueta só pode ser aplicada a cards do quadro a que pertence.
- **RN-F2.** O filtro por etiquetas é por **união**: o card é exibido se tiver ao menos uma das etiquetas selecionadas. Sem seleção, não há filtro.
- **RN-F3.** O filtro é só de visualização, individual, e não altera dados.
- **RN-F4.** Comentários são exibidos em ordem cronológica crescente, com autor e data/hora, e são imutáveis.

### Papéis e atribuições
- **RN-R1.** Só membros do quadro podem ser responsáveis por seus cards. Um card pode ter vários responsáveis; o mesmo membro conta uma única vez.
- **RN-R2.** Convites exigem e-mail de conta existente e resultam em adesão imediata ao quadro com o papel escolhido.
- **RN-R3.** Um membro com papel Observador pode ser responsável por um card (a atribuição é informativa), mas não pode editá-lo.

---

## 6. Casos de borda e condições de erro

### 6.1 Validação de entrada
- **B1.** Campos obrigatórios vazios ou só com espaços são recusados; os espaços das pontas dos textos válidos são descartados.
- **B2.** Textos acima do limite são recusados com mensagem indicando o limite (o sistema não trunca silenciosamente).
- **B3.** E-mail em formato inválido é recusado no cadastro, no login e no convite.
- **B4.** Data de prazo inexistente (ex.: 31/02) ou em formato inválido é recusada, mantendo o valor anterior.
- **B5.** Texto com caracteres especiais, acentos, emojis ou marcação (ex.: `<b>`) é armazenado e exibido literalmente, sem ser interpretado como conteúdo ativo.
- **B6.** Cor de etiqueta fora da paleta é recusada.

### 6.2 Concorrência e dados obsoletos
- **B7.** Se um usuário age sobre um item que outro membro acabou de excluir (card, lista, etiqueta, checklist etc.), a ação falha com mensagem de que o item não existe mais, e a visão é atualizada. Nenhum dado é criado de forma órfã.
- **B8.** Se dois usuários movem/reordenam itens ao mesmo tempo, o resultado final é uma ordem única e consistente, sem cards ou listas duplicados ou perdidos; o usuário cuja ação foi aplicada primeiro não perde o efeito.
- **B9.** Se duas pessoas editam o mesmo campo simultaneamente, prevalece a última gravação; nenhuma das duas recebe erro.
- **B10.** Se um membro é removido ou rebaixado enquanto está com o quadro aberto, sua próxima ação é avaliada com o papel atual; se perdeu o acesso, vê "quadro não encontrado"; se perdeu permissão, vê mensagem de permissão insuficiente.
- **B11.** Se dois cadastros com o mesmo e-mail ocorrem simultaneamente, apenas um é criado.

### 6.3 Acesso e autorização
- **B12.** Tentativa de acessar quadro, lista, card ou qualquer item de um quadro do qual não é membro é tratada como "não encontrado", sem revelar se o item existe.
- **B13.** Tentativa de ação sem permissão suficiente é recusada com mensagem de permissão insuficiente, sem efeito parcial.
- **B14.** Sessão expirada no meio de uma ação: a ação não é executada, o usuário é levado ao login e, ao autenticar-se, retorna ao ponto em que estava (sem reenvio automático dos dados não gravados).
- **B15.** Tentar convidar a si mesmo ou alguém que já é membro é recusado.
- **B16.** Tentar rebaixar ou remover o último Administrador é recusado.
- **B17.** Se o usuário é Observador e abre um quadro, nenhum controle de edição é apresentado como ativo.

### 6.4 Listas, cards e posições
- **B18.** Mover um card para a posição em que já está não altera nada e não gera erro.
- **B19.** Posição de destino fora do intervalo (maior que o número de itens + 1, ou menor que 1) é ajustada ao limite válido mais próximo (início ou fim) em vez de falhar.
- **B20.** Mover card para lista inexistente ou de outro quadro é recusado; o card permanece onde estava.
- **B21.** Quadro sem listas, e lista sem cards, são estados válidos e exibidos com indicação de vazio.
- **B22.** Excluir a última lista de um quadro é permitido.
- **B23.** Excluir uma lista com cards e cancelar a confirmação não deve alterar nada, inclusive a ordem.
- **B24.** Excluir uma lista **não** move seus cards para outras listas; o texto de confirmação deixa explícito que os cards serão excluídos.
- **B25.** Cards com muitos itens de checklist, comentários ou etiquetas continuam exibidos corretamente, e o progresso mantém o cálculo de RN-D1.

### 6.5 Checklists e progresso
- **B26.** Checklist sem itens não afeta o progresso do card; um card só com checklists vazias exibe "sem itens".
- **B27.** Excluir o único item marcado de uma checklist com outros itens desmarcados leva o progresso a 0%, e não a "sem itens".
- **B28.** Percentual arredondado para baixo: 1 de 3 itens = 33%, 2 de 3 = 66%; 100% só quando todos os itens estão marcados.

### 6.6 Etiquetas e filtro
- **B29.** Aplicar a um card uma etiqueta que acabou de ser excluída é recusado (ver B7).
- **B30.** Se uma etiqueta selecionada no filtro é excluída, ela deixa de contar no filtro; se não restam etiquetas selecionadas, o filtro fica inativo.
- **B31.** Cards movidos ou criados enquanto o filtro está ativo respeitam o filtro: um card novo sem etiquetas deixa de aparecer no filtro, e o usuário é avisado de que o filtro está ativo.
- **B32.** Um quadro sem nenhuma etiqueta exibe o filtro vazio, com indicação de que não há etiquetas.

### 6.7 Prazos
- **B33.** Cards concluídos nunca são contados como atrasados no resumo do quadro.
- **B34.** Se o prazo é removido de um card atrasado, o card deixa de contar como atrasado imediatamente.
- **B35.** Usuários em fusos diferentes podem ver o mesmo card como atrasado ou não por um breve período na virada do dia; isso é esperado e decorre de RN-D3.

### 6.8 Quadros e membros
- **B36.** Excluir um quadro com muitos membros: todos perdem o acesso; quem estava com o quadro aberto recebe "quadro não encontrado" na próxima ação.
- **B37.** Um usuário sem nenhum quadro vê estado vazio com orientação para criar o primeiro.
- **B38.** Convidar com e-mail em caixa diferente da cadastrada (ex.: `BIA@ex.com`) encontra a conta existente (RN-A1).
- **B39.** Quando uma atribuição é removida porque o membro saiu do quadro, o card permanece com os demais responsáveis.

---

## 7. Decisões de interpretação

Pontos da intenção original que admitem mais de uma leitura e foram fixados explicitamente:

| Tema | Decisão |
|---|---|
| Exclusão de lista com cards | Exige confirmação e **exclui** os cards junto; cards não são movidos nem preservados. |
| Convite de membros | Apenas para e-mails de contas existentes; adesão imediata, sem aceite. |
| Papéis | Três: Administrador (tudo), Colaborador (edita conteúdo), Observador (somente leitura). |
| Quem edita/exclui o quadro | Qualquer Administrador do quadro, não apenas o criador. |
| Atrasado | Prazo anterior ao dia atual e card não concluído. Introduz-se o estado "concluído" no card, necessário para que cards finalizados não sejam sinalizados como atrasados. |
| Prazo | Data sem horário. |
| Filtro por várias etiquetas | União (pelo menos uma). Individual e não persistente. |
| Comentários | Imutáveis (sem edição/exclusão individual); compõem o histórico. |
| Etiquetas | Pertencem ao quadro; criadas por Colaboradores e Administradores. |
| Progresso | Soma de todos os itens de todas as checklists do card; não conclui o card sozinho. |
