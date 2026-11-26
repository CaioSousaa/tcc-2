# Especificação Funcional - Sistema de Quadros Kanban

## 1. Visão Geral

Sistema colaborativo de gerenciamento de tarefas baseado em quadros Kanban, permitindo que usuários se autentiquem, criem e gerenciem quadros pessoais ou compartilhados, organizem tarefas em listas e cards, trabalhem com membros em diferentes papéis, acompanhem progresso de tarefas via checklists, filtrem por etiquetas, comentem e definam prazos.

---

## 2. Autenticação e Sessão

### 2.1 Cadastro de Usuário

**Descrição:** Novo usuário pode se registrar fornecendo email e senha.

**Critérios de Aceite:**

```
Given um usuário não registrado
When preenche email, nome e senha no formulário de cadastro
Then conta é criada no banco de dados
And usuário é autenticado imediatamente
And é redirecionado para página de quadros
```

**Regras de Negócio:**
- Email deve ser único no sistema
- Senha deve ter mínimo 6 caracteres
- Nome do usuário é obrigatório
- Email é obrigatório e válido (formato RFC 5322 básico)

**Casos de Borda e Erros:**
- Email já existe: retorna erro "Email já cadastrado"
- Campos vazios: validação de campos obrigatórios
- Senha muito curta: retorna erro "Senha deve ter pelo menos 6 caracteres"

---

### 2.2 Login

**Descrição:** Usuário registrado pode fazer login com email e senha.

**Critérios de Aceite:**

```
Given um usuário registrado com email e senha
When preenche email e senha corretos
Then recebe token de autenticação (JWT ou similar)
And é redirecionado para página de quadros
And permanece autenticado até logout ou token expirar
```

**Critérios de Aceite (credenciais inválidas):**

```
Given um usuário fornecendo credenciais inválidas
When submete formulário de login
Then retorna erro "Email ou senha incorretos"
And permanece na página de login
```

**Regras de Negócio:**
- Login requer email e senha válidos
- Token de autenticação persiste entre sessões (via cookie ou localStorage)
- Sessão mantém-se válida enquanto token não expirou

**Casos de Borda e Erros:**
- Email não existe: genérico "Email ou senha incorretos"
- Senha incorreta: genérico "Email ou senha incorretos"
- Token expirado: usuário deve fazer login novamente

---

### 2.3 Persistência de Sessão

**Descrição:** Usuário autenticado permanece logado ao recarregar página ou fechar/abrir navegador.

**Critérios de Aceite:**

```
Given um usuário autenticado
When recarrega a página ou fecha o navegador
And abre novamente a aplicação
Then continua autenticado sem fazer login novamente
And consegue acessar dados pessoais imediatamente
```

**Regras de Negócio:**
- Token armazenado no cliente (cookie seguro ou localStorage)
- Token validado no backend quando usuário acessa recursos
- Sessão expira após período de inatividade (ex: 30 dias)

**Casos de Borda e Erros:**
- Token inválido ou corrompido: usuário redirecionado para login
- Token expirado: usuário redirecionado para login com mensagem "Sessão expirada"

---

### 2.4 Logout

**Descrição:** Usuário pode encerrar sessão.

**Critérios de Aceite:**

```
Given um usuário autenticado
When clica em "Sair" ou "Logout"
Then token é removido do cliente
And é redirecionado para página de login
And não consegue acessar recursos protegidos
```

---

## 3. Gerenciamento de Quadros

### 3.1 Criar Quadro

**Descrição:** Usuário autenticado pode criar novo quadro pessoal.

**Critérios de Aceite:**

```
Given um usuário autenticado
When preenche nome do quadro
And clica em "Criar Quadro"
Then quadro é criado e associado ao usuário
And usuário é redirecionado para quadro vazio
And usuário é automaticamente administrador do quadro
```

**Regras de Negócio:**
- Nome do quadro é obrigatório (não vazio, máx 255 caracteres)
- Criador é automaticamente proprietário e administrador
- Quadro começa vazio (sem listas)
- Cada usuário pode ter múltiplos quadros

**Casos de Borda e Erros:**
- Nome vazio: erro "Nome do quadro é obrigatório"
- Nome duplicado para mesmo usuário: permitido (nomes não precisam ser únicos)
- Limite de quadros por usuário: não há limite especificado

---

### 3.2 Ver Lista de Quadros

**Descrição:** Usuário vê todos os quadros que possui ou é membro.

**Critérios de Aceite:**

```
Given um usuário autenticado
When acessa página "Meus Quadros"
Then vê lista de todos os quadros que criou ou é membro
And cada quadro mostra: nome, proprietário, quantidade de membros
And pode clicar para entrar em quadro
```

**Regras de Negócio:**
- Usuário vê quadros que é proprietário e quadros compartilhados
- Quadros são ordenados por data de acesso recente (padrão)
- Pode haver filtros ou busca (não obrigatório nesta fase)

---

### 3.3 Editar Quadro

**Descrição:** Proprietário ou administrador de quadro pode editar seu nome.

**Critérios de Aceite:**

```
Given um usuário que é proprietário/admin do quadro
When clica em "Editar" ou ícone de configuração
And altera nome do quadro
And salva mudança
Then nome é atualizado imediatamente
And outros membros veem mudança refletida
```

**Regras de Negócio:**
- Apenas proprietário e administradores podem editar
- Novo nome segue mesmas validações de criação
- Mudança é imediata para todos os membros

**Casos de Borda e Erros:**
- Usuário sem permissão tenta editar: erro "Permissão negada"
- Nome vazio após edição: erro "Nome do quadro é obrigatório"

---

### 3.4 Deletar Quadro

**Descrição:** Proprietário ou administrador pode deletar quadro permanentemente.

**Critérios de Aceite:**

```
Given um usuário que é proprietário/admin do quadro
When clica em "Deletar Quadro"
And confirma exclusão em modal de confirmação
Then quadro é removido do banco de dados
And todos os dados do quadro (listas, cards, etc) são deletados
And usuário é redirecionado para "Meus Quadros"
```

**Regras de Negócio:**
- Apenas proprietário pode deletar (administradores podem não ter este direito, a definir)
- Exclusão é permanente e irrecuperável
- Requer confirmação explícita do usuário
- Todos os dados relacionados (listas, cards, comentários, etc) são deletados em cascata

**Casos de Borda e Erros:**
- Usuário sem permissão tenta deletar: erro "Permissão negada"
- Quadro com membros: permitir deleção, remover todos (confirmação deve avisar)

---

## 4. Gerenciamento de Listas

### 4.1 Criar Lista

**Descrição:** Usuário membro do quadro pode criar nova lista dentro do quadro.

**Critérios de Aceite:**

```
Given um usuário dentro de um quadro
When clica em "Adicionar Lista" ou botão similar
And preenche nome da lista
And clica em "Criar"
Then lista é criada ao final das listas existentes
And lista aparece vazia
And campo de entrada é limpo para próxima lista
```

**Regras de Negócio:**
- Nome da lista é obrigatório (não vazio, máx 255 caracteres)
- Lista criada sem cards
- Qualquer membro do quadro pode criar listas
- Ordem inicial: adicionada ao final

**Casos de Borda e Erros:**
- Nome vazio: erro "Nome da lista é obrigatório"
- Nomes duplicados na mesma listas: permitido

---

### 4.2 Renomear Lista

**Descrição:** Usuário membro pode mudar nome da lista.

**Critérios de Aceite:**

```
Given um usuário dentro de um quadro
When clica em nome da lista ou em ícone de editar
And altera texto do nome
And confirma mudança (Enter ou botão "Salvar")
Then nome da lista é atualizado imediatamente
And mudança é visível para todos os membros
```

**Regras de Negócio:**
- Qualquer membro pode renomear
- Novo nome segue mesmas validações

**Casos de Borda e Erros:**
- Nome vazio após edição: erro ou reverter para nome anterior

---

### 4.3 Reordenar Listas

**Descrição:** Usuário membro pode mudar ordem das listas no quadro.

**Critérios de Aceite:**

```
Given um usuário dentro de um quadro com múltiplas listas
When arrasta uma lista para nova posição
Then lista é movida para novo índice
And ordem é persistida
And outros membros veem nova ordem
```

**Regras de Negócio:**
- Drag-and-drop ou interface similar
- Qualquer membro pode reordenar
- Ordem é salva no banco de dados

---

### 4.4 Deletar Lista

**Descrição:** Usuário membro pode deletar lista do quadro.

**Critérios de Aceite (lista vazia):**

```
Given uma lista sem cards
When clica em "Deletar" ou ícone de lixeira
And confirma exclusão
Then lista é removida do quadro
And usuário vê quadro atualizado
```

**Critérios de Aceite (lista com cards):**

```
Given uma lista contendo cards
When clica em "Deletar"
And abre modal de confirmação
Then modal exibe mensagem sobre cards na lista
And oferece opção: "Mover para..." ou "Deletar tudo"
When escolhe "Mover para..."
Then cards são movidos para lista selecionada
And lista é deletada
When escolhe "Deletar tudo"
Then cards e lista são deletados
```

**Regras de Negócio:**
- Qualquer membro pode deletar lista
- Se lista tem cards: requer ação explícita (mover ou deletar)
- Deleção é permanente
- Se cards são movidos, mantêm todas as propriedades (checklists, comentários, etc)

**Casos de Borda e Erros:**
- Lista com muitos cards: UI não trava, aviso claro sobre quantidade

---

## 5. Gerenciamento de Cards

### 5.1 Criar Card

**Descrição:** Usuário membro pode criar novo card dentro de lista.

**Critérios de Aceite:**

```
Given um usuário dentro de um quadro
When clica em "Adicionar Card" ou campo de criação rápida na lista
And preenche título do card
And clica Enter ou "Criar"
Then card é criado ao final da lista
And card é exibido com título
And campo de entrada é limpo
```

**Regras de Negócio:**
- Título é obrigatório (não vazio, máx 255 caracteres)
- Card criado sem descrição, checklists, comentários ou labels
- Sem data limite padrão
- Nenhum membro atribuído por padrão
- Qualquer membro pode criar cards

**Casos de Borda e Erros:**
- Título vazio: erro ou não cria

---

### 5.2 Editar Card

**Descrição:** Usuário membro pode editar propriedades do card.

**Critérios de Aceite:**

```
Given um usuário dentro de um quadro
When clica em card para abrir detalhe/modal
Then modal exibe:
  - Título (editável)
  - Descrição (editável)
  - Checklists
  - Comentários
  - Labels
  - Data limite
  - Membros atribuídos
When edita qualquer campo
And clica fora ou em "Salvar"
Then mudança é persistida
And outros membros veem atualização
```

**Regras de Negócio:**
- Qualquer membro pode editar
- Descrição pode ter formatação simples (markdown ou plain text, a definir)
- Mudanças são salvas imediatamente ao sair do campo (ou ao clicar salvar)

---

### 5.3 Excluir Card

**Descrição:** Usuário membro pode deletar card.

**Critérios de Aceite:**

```
Given um usuário dentro de card aberto
When clica em "Deletar Card"
And confirma exclusão
Then card é removido da lista
And modal é fechado
And todos os dados associados (checklists, comentários) são deletados
```

**Regras de Negócio:**
- Qualquer membro pode deletar
- Deleção é permanente
- Requer confirmação

---

### 5.4 Mover Card Entre Listas

**Descrição:** Usuário pode mover card para outra lista no mesmo quadro.

**Critérios de Aceite:**

```
Given um usuário dentro de um quadro
When arrasta card de uma lista para outra lista
Then card é removido da lista original
And adicionado à nova lista
And posição/ordem é mantida (ou adiciona ao final)
And propriedades do card são mantidas
And mudança é refletida para todos os membros
```

**Critérios de Aceite (via modal):**

```
Given um card aberto em modal
When clica em "Mover" ou campo de lista
And seleciona nova lista
Then card é movido
And modal permanece aberto ou fecha
```

**Regras de Negócio:**
- Drag-and-drop é método principal
- Qualquer membro pode mover
- Card mantém todas propriedades ao mover
- Ordem relativa à lista é preservada ou colocada no final (a definir)

---

## 6. Checklists

### 6.1 Adicionar Checklist ao Card

**Descrição:** Usuário pode criar checklist dentro de card para rastrear subtarefas.

**Critérios de Aceite:**

```
Given um card aberto em modal
When clica em "Adicionar Checklist" ou ícone similar
And preenche nome/título do checklist
And clica "Criar"
Then checklist é adicionado ao card
And exibe em seção de checklists
And campo de itens é vazio
And barra de progresso mostra 0%
```

**Regras de Negócio:**
- Título do checklist é obrigatório
- Um card pode ter múltiplos checklists
- Checklist começa vazio
- Progresso é calculado como: itens marcados / total de itens

**Casos de Borda e Erros:**
- Título vazio: erro

---

### 6.2 Adicionar Item ao Checklist

**Descrição:** Usuário pode adicionar itens (tarefas) a um checklist.

**Critérios de Aceite:**

```
Given um checklist dentro de card
When clica em "Adicionar Item" ou campo de entrada
And preenche texto do item
And clica Enter ou "Adicionar"
Then item é adicionado à lista
And aparece com checkbox desmarcado
And barra de progresso é atualizada
```

**Regras de Negócio:**
- Texto do item é obrigatório
- Items começam desmarcados
- Múltiplos items por checklist

---

### 6.3 Marcar/Desmarcar Item

**Descrição:** Usuário pode marcar item como concluído.

**Critérios de Aceite:**

```
Given um item dentro de checklist
When clica no checkbox
Then item é marcado (visual: strikethrough ou destacado)
And barra de progresso do checklist é atualizada
And barra de progresso do card é atualizada (se houver)
And mudança é persistida
```

**Regras de Negócio:**
- Marcação é binária (marcado/desmarcado)
- Progresso do checklist = itens marcados / total
- Qualquer membro pode marcar/desmarcar

---

### 6.4 Deletar Item do Checklist

**Descrição:** Usuário pode remover item do checklist.

**Critérios de Aceite:**

```
Given um item dentro de checklist
When clica em ícone deletar ou "Remover"
Then item é removido
And barra de progresso é atualizada
```

---

### 6.5 Deletar Checklist

**Descrição:** Usuário pode remover checklist inteiro do card.

**Critérios de Aceite:**

```
Given um checklist dentro de card
When clica em "Deletar Checklist"
And confirma
Then checklist e todos seus items são removidos
And card é atualizado
```

---

## 7. Membros e Papéis

### 7.1 Papéis e Permissões

**Papéis definidos:**

1. **Proprietário**: Criador do quadro. Pode: tudo (editar, deletar quadro, gerenciar membros, alterar papéis)
2. **Administrador**: Nível elevado. Pode: editar quadro, gerenciar membros, criar/editar/deletar listas e cards
3. **Membro**: Nível padrão. Pode: criar/editar/deletar listas e cards, comentar, ser atribuído a cards
4. **Observador**: Acesso somente leitura. Pode: visualizar quadro e cards, comentar (ou não, a definir)

**Nota:** Definição de permissões específicas pode ser refinada. Base: proprietário > admin > membro > observador.

---

### 7.2 Convidar Membro

**Descrição:** Administrador ou proprietário pode convidar novo membro para quadro.

**Critérios de Aceite:**

```
Given um proprietário/admin em quadro
When clica em "Gerenciar Membros" ou "Convidar"
And preenche email do usuário a convidar
And seleciona papel (Membro ou Observador)
And clica "Enviar Convite"
Then convite é enviado para email
And novo membro aparece em lista com status "Convidado"
And usuário convidado recebe notificação (email)
```

**Critérios de Aceite (usuário clica no convite):**

```
Given um usuário recebendo convite
When clica em link ou botão "Aceitar Convite"
Then é adicionado ao quadro
And seu status muda de "Convidado" para o papel definido
And consegue acessar quadro imediatamente
```

**Regras de Negócio:**
- Convite é válido por período definido (ex: 7 dias)
- Convite não expirado permite qualquer membro aceitar (deve-se verificar se convite é seguro ou pessoal)
- Email deve corresponder a usuário registrado
- Usuário não pode ser convidado duas vezes simultaneamente

**Casos de Borda e Erros:**
- Email não existe no sistema: erro "Usuário não encontrado"
- Usuário já é membro: erro "Usuário já é membro"
- Convite expirado: erro ao tentar aceitar

---

### 7.3 Gerenciar Papéis de Membros

**Descrição:** Proprietário ou admin pode alterar papel de membro.

**Critérios de Aceite:**

```
Given um proprietário/admin em "Gerenciar Membros"
When clica em papel do membro
And seleciona novo papel
Then papel é atualizado imediatamente
And mudança é persistida
And membro vê sua nova permissão refletida (ex: campos bloqueados se demovido)
```

**Regras de Negócio:**
- Proprietário não pode ser rebaixado (apenas para admin, não abordado nesta fase)
- Mudança de papel é imediata
- Restrições: proprietário pode ter papel superior

---

### 7.4 Remover Membro

**Descrição:** Proprietário ou admin pode remover membro do quadro.

**Critérios de Aceite:**

```
Given um proprietário/admin em "Gerenciar Membros"
When clica em "Remover" ou ícone similar no membro
And confirma remoção
Then membro é removido do quadro
And membro perde acesso imediatamente
And cards atribuídos ao membro permanecem intactos (atribuição não é removida, apenas acesso)
```

**Regras de Negócio:**
- Proprietário não pode remover a si mesmo
- Remoção é imediata
- Cards atribuídos mantêm a atribuição (histórico)

---

### 7.5 Atribuir Membro a Card

**Descrição:** Usuário pode atribuir membros do quadro a um card.

**Critérios de Aceite:**

```
Given um card aberto em modal
When clica em "Atribuir a" ou seção de membros
And seleciona um ou múltiplos membros do quadro
Then membro(s) é/são atribuído(s) ao card
And aparecem visualmente no card (avatar ou nome)
And membro atribuído recebe notificação (opcional, a definir)
```

**Critérios de Aceite (remover atribuição):**

```
Given um membro já atribuído ao card
When clica em "X" ou "Remover" próximo ao membro
Then atribuição é removida
And card é atualizado
```

**Regras de Negócio:**
- Um card pode ter múltiplos membros atribuídos
- Membros atribuídos devem ser membros do quadro
- Qualquer membro pode atribuir/desatribuir

---

## 8. Etiquetas

### 8.1 Criar Etiqueta

**Descrição:** Administrador ou membro (a definir) pode criar etiqueta colorida no quadro.

**Critérios de Aceite:**

```
Given um usuário em quadro
When acessa "Gerenciar Etiquetas" ou clica em ícone de label
And clica "Criar Etiqueta"
And preenche nome e seleciona cor
And clica "Criar"
Then etiqueta é criada
And aparece em lista de etiquetas do quadro
And está disponível para uso em cards
```

**Regras de Negócio:**
- Nome da etiqueta é obrigatório (máx 50 caracteres)
- Cor é selecionada de paleta pré-definida (ou campo livre, a definir)
- Etiqueta é global ao quadro (todos membros veem)
- Qualquer membro pode criar (ou apenas admins, a definir)

**Casos de Borda e Erros:**
- Nome vazio: erro
- Nome duplicado: permitido ou erro (a definir)

---

### 8.2 Adicionar Etiqueta a Card

**Descrição:** Usuário pode adicionar uma ou múltiplas etiquetas a card.

**Critérios de Aceite:**

```
Given um card aberto em modal
When clica em seção de "Etiquetas" ou "Adicionar label"
And seleciona uma ou múltiplas etiquetas
Then etiqueta(s) é/são adicionada(s) ao card
And aparecem visualmente no card (tag colorida)
And mudança é persistida
```

**Critérios de Aceite (remover etiqueta):**

```
Given um card com etiqueta
When clica em "X" ou "Remover" na etiqueta
Then etiqueta é removida
And card é atualizado
```

---

### 8.3 Filtrar Cards por Etiqueta

**Descrição:** Usuário pode filtrar cards do quadro por uma ou múltiplas etiquetas.

**Critérios de Aceite:**

```
Given um usuário em quadro
When clica em "Filtrar" ou campo de filtros
And seleciona uma ou mais etiquetas
Then quadro exibe apenas cards que possuem todas etiquetas selecionadas (AND logic)
And cards sem as etiquetas são ocultados
And filtro pode ser limpo para voltar à visualização completa
```

**Regras de Negócio:**
- Lógica de filtro: AND (card deve ter TODAS as etiquetas selecionadas)
- Alternativamente: OR (card deve ter ALGUMA das etiquetas) - a definir
- Filtro não afeta a estrutura do quadro, apenas visualização

**Casos de Borda e Erros:**
- Nenhum card corresponde ao filtro: mensagem "Nenhum card encontrado"

---

### 8.4 Deletar Etiqueta

**Descrição:** Admin pode deletar etiqueta do quadro.

**Critérios de Aceite:**

```
Given um admin em "Gerenciar Etiquetas"
When clica em "Deletar" ou ícone de lixeira
And confirma deleção
Then etiqueta é removida
And todos os cards que possuem a etiqueta mantêm a referência (a definir: manter ou remover)
```

**Regras de Negócio:**
- Apenas admins podem deletar (ou proprietário, a definir)
- Deleção é permanente
- Cards que usam etiqueta: a definir se mantêm referência quebrada ou etiqueta é removida automaticamente

---

## 9. Comentários

### 9.1 Adicionar Comentário

**Descrição:** Membro pode comentar em card.

**Critérios de Aceite:**

```
Given um card aberto em modal
When clica em seção "Comentários"
And preenche texto do comentário
And clica "Enviar" ou Enter
Then comentário é adicionado ao card
And aparece com nome do autor e timestamp
And campo é limpo para novo comentário
And outros membros veem comentário em tempo real (ou ao atualizar)
```

**Regras de Negócio:**
- Texto do comentário é obrigatório (não vazio)
- Comentário pode ter formatação simples (plain text ou markdown, a definir)
- Timestamp mostra data/hora de criação
- Qualquer membro pode comentar

**Casos de Borda e Erros:**
- Texto vazio: não permite envio

---

### 9.2 Editar Comentário

**Descrição:** Autor do comentário pode editar seu próprio comentário.

**Critérios de Aceite:**

```
Given um comentário criado por usuário
When clica em "Editar" ou ícone de lápis no comentário
Then texto é editável
When altera texto e clica "Salvar"
Then comentário é atualizado
And exibe indicação "Editado" com timestamp
```

**Regras de Negócio:**
- Apenas autor pode editar próprio comentário
- Edição não altera timestamp de criação
- Indicação "Editado" mostra que foi modificado

---

### 9.3 Deletar Comentário

**Descrição:** Autor do comentário ou admin pode deletar comentário.

**Critérios de Aceite:**

```
Given um comentário no card
When autor ou admin clica em "Deletar" ou ícone de lixeira
And confirma deleção
Then comentário é removido
And lista de comentários é atualizada
```

---

### 9.4 Ver Histórico de Comentários

**Descrição:** Usuário vê todos os comentários do card em ordem cronológica.

**Critérios de Aceite:**

```
Given um card aberto em modal
When acessa seção "Comentários"
Then vê lista de todos os comentários
And ordenados por data (mais antigos primeiro ou mais recentes primeiro, a definir)
And cada comentário mostra: autor, texto, timestamp, status "Editado" (se aplicável)
And pode rolar para ver mais comentários se houver muitos
```

---

## 10. Prazos

### 10.1 Definir Prazo no Card

**Descrição:** Usuário pode definir data limite para card.

**Critérios de Aceite:**

```
Given um card aberto em modal
When clica em "Adicionar Prazo" ou seção de data limite
And seleciona data no calendário (ou digita data)
Then data é salva no card
And prazo é exibido visualmente no card e no modal
And cor/indicador muda se prazo está próximo ou vencido (a definir cores)
```

**Regras de Negócio:**
- Apenas uma data limite por card
- Data pode ser no passado (útil para marcar itens atrasados)
- Formato de data consistente com localidade (BR: DD/MM/YYYY)

---

### 10.2 Identificar Cards Atrasados

**Descrição:** Sistema destaca ou marca cards com prazo vencido.

**Critérios de Aceite:**

```
Given um card com prazo definido no passado
When usuário visualiza o quadro
Then card é destacado visualmente (cor vermelha, ícone, badge "Atrasado")
And todos os membros veem indicação
```

**Critérios de Aceite (prazo próximo):**

```
Given um card com prazo em até 3 dias (configurável)
When usuário visualiza o quadro
Then card é destacado com cor diferente (amarela, laranja, a definir)
And indica "Vence em X dias"
```

**Regras de Negócio:**
- Verificação é em tempo real (ou ao carregar página)
- Cores/indicadores consistentes em todo o sistema
- Observadores e membros veem as mesmas indicações

---

### 10.3 Remover Prazo

**Descrição:** Usuário pode remover prazo do card.

**Critérios de Aceite:**

```
Given um card com prazo definido
When clica em "X" ou "Remover Prazo"
Then prazo é removido
And card volta à visualização normal (sem indicador de prazo)
```

---

## 11. Casos de Borda Gerais e Tratamento de Erros

### 11.1 Perda de Conexão

```
Given usuário trabalhando no quadro
When perde conexão de internet
Then:
  - Se operação estava em progresso: exibe erro "Falha na conexão"
  - Usuário pode tentar novamente
  - Dados locais não são perdidos (se armazenado em cache)
  - Ao reconectar: sincroniza com servidor
```

### 11.2 Dados Conflitantes (Edições Simultâneas)

```
Given dois usuários editando o mesmo card simultaneamente
When ambos salvam mudanças
Then:
  - Primeira edição é salva
  - Segunda edição sobrescreve ou exibe conflito (a definir)
  - Usuário recebe notificação de conflito
```

### 11.3 Sessão Expirada Durante Edição

```
Given usuário com sessão expirada
When tenta salvar mudança
Then:
  - Recebe erro "Sessão expirada"
  - É redirecionado para login
  - Mudanças não salvas são perdidas (a menos que cache local preserve)
```

### 11.4 Validação de Permissões

```
Given usuário tentando acessar quadro que não é membro
When tenta acessar URL direto
Then:
  - É redirecionado para "Meus Quadros"
  - Exibe mensagem "Você não tem acesso a este quadro"
```

### 11.5 Cards/Listas Deletadas Durante Visualização

```
Given usuário com card/lista aberta em modal
When admin deleta card/lista em outro cliente
Then:
  - Usuário vê erro "Item foi deletado"
  - Modal é fechado
  - Usuário volta à visualização do quadro
```

---

## 12. Fluxo de Usuário Completo (Cenário Fim-a-Fim)

1. Novo usuário: Cadastro → Login → Cria quadro → Cria listas → Cria cards
2. Adiciona membros: Convida via email → Membros aceitam → Membros veem quadro
3. Trabalho colaborativo:
   - Cria card com título
   - Abre card → Adiciona descrição, etiquetas, prazo, checklists
   - Atribui a membros
   - Membros comentam e marcam checklist
   - Identifica card atrasado pela cor vermelha
   - Move card para lista "Concluído"
4. Limpeza: Admin deleta lista vazia → Proprietário deleta quadro

---

## 13. Resumo de Requisitos Funcionais

| Funcionalidade | Status | Notas |
|---|---|---|
| Cadastro/Login | Requerido | Persistência de sessão essencial |
| CRUD Quadros | Requerido | Incluir cascata de deleção |
| CRUD Listas | Requerido | Suportar reordenação |
| CRUD Cards | Requerido | Suportar movimento entre listas |
| Checklists | Requerido | Cálculo automático de progresso |
| Membros e Papéis | Requerido | Convites, permissões por papel |
| Etiquetas | Requerido | Coloridas, filtráveis |
| Comentários | Requerido | Histórico, edição, deleção |
| Prazos | Requerido | Indicadores visuais de atraso |
| Validações | Requerido | Campos obrigatórios, erros claros |
| Tratamento de Erros | Requerido | Feedback ao usuário em todos cenários |

---

## 14. Notas Técnicas (Informativas, não prescritivas)

- Sincronização em tempo real entre clientes é desejável (WebSockets ou polling)
- Notificações podem ser implementadas via email ou in-app
- Busca e filtros avançados podem ser adicionados em futuras versões
- Histórico de alterações (quem fez o quê e quando) pode ser rastreado para auditoria
- Backups automáticos são recomendados para recuperação de dados

---

**Versão:** 1.0  
**Data:** 2026-10-05  
**Status:** Aprovado para Implementação
