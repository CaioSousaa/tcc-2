// Cria os formulários da avaliação de fidelidade (um por avaliador).
// As imagens e o ordens.json chegam na pasta do Drive pelo doPost (envio feito pelo autor).

const TOKEN = '__TOKEN__'; // defina um valor aleatório antes de implantar o doPost
const PASTA = 'Avaliação TCC - fidelidade das telas';

const APRESENTACAO =
  'Esta avaliação faz parte do meu TCC em Sistemas de Informação na UFC Quixadá, orientado pelo Prof. Regis Pires Magalhães. ' +
  'Você vai comparar telas de uma aplicação web com as telas de um protótipo e dar notas para o quanto elas se parecem. ' +
  'Cada tela leva cerca de um minuto. No trabalho, seu nome não aparece: você será identificado como Avaliador 1, 2 ou 3. ' +
  'Pode parar quando quiser. Se estiver conectado à sua conta Google, o formulário guarda o que você já respondeu e dá para continuar depois.';

const COMO_AVALIAR =
  'Em cada tela há duas imagens: o protótipo à esquerda e a tela avaliada à direita. ' +
  'Compare as duas e dê uma nota de 0 a 2 em cada dimensão, seguindo a tabela abaixo.\n\n' +
  '• Avalie só a aparência. Não é preciso testar se a tela funciona.\n' +
  '• Textos e dados de exemplo diferentes, como o nome ou a ordem dos quadros e o título dos cards, não contam.\n' +
  '• Cada problema conta em uma dimensão só: um botão com a cor errada pesa no estilo visual, não na estrutura.\n' +
  '• Na dúvida entre duas notas, escolha a que descreve a maior parte da tela e explique no comentário.\n' +
  '• As imagens ficam pequenas no formulário. Para ver detalhes, use o zoom do navegador (Ctrl e + no computador, pinça no celular).';

const D1 = ['2: estão todos', '1: falta parte ou foi trocada', '0: não aparecem ou quase não aparecem'];
const D2 = ['2: mesmos lugares e mesma organização', '1: lembra, mas com blocos em outra posição ou ordem', '0: sem relação com o protótipo'];
const D3 = ['2: seguem', '1: em parte, com diferenças visíveis', '0: estilo diferente'];

function pasta_() {
  const it = DriveApp.getFoldersByName(PASTA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PASTA);
}

function arquivo_(f, nome) {
  const it = f.getFilesByName(nome);
  if (!it.hasNext()) throw new Error('Arquivo não encontrado na pasta: ' + nome);
  return it.next();
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.token !== TOKEN) return ContentService.createTextOutput('negado');
  const f = pasta_();
  const antigos = f.getFilesByName(d.name);
  while (antigos.hasNext()) antigos.next().setTrashed(true);
  f.createFile(Utilities.newBlob(Utilities.base64Decode(d.b64), d.mime, d.name));
  return ContentService.createTextOutput('ok ' + d.name);
}

// Execução retomável: o Apps Script corta cada execução em 6 minutos, então cada chamada de
// continuar() adiciona telas por até ~4,5 minutos e guarda onde parou. Rodar até o log dizer "tudo pronto".
const LIMITE_MS = 270000;

function continuar() {
  const t0 = Date.now();
  const props = PropertiesService.getScriptProperties();
  const f = pasta_();
  const ordens = JSON.parse(arquivo_(f, 'ordens.json').getBlob().getDataAsString());
  for (const av of ['A1', 'A2', 'A3']) {
    if (props.getProperty(av + '_pronto')) continue;
    let formId = props.getProperty(av + '_form');
    let form;
    if (!formId) {
      form = cabecalho_(av, f);
      props.setProperty(av + '_form', form.getId());
      props.setProperty(av + '_prox', '0');
    } else {
      form = FormApp.openById(formId);
    }
    const codigos = ordens[av];
    const n = codigos.length;
    let i = Number(props.getProperty(av + '_prox'));
    while (i < n) {
      if (Date.now() - t0 > LIMITE_MS) {
        Logger.log(av + ': parou em ' + i + ' de ' + n + '. Rode continuar() de novo.');
        return;
      }
      tela_(form, f, codigos[i], i, n);
      i++;
      props.setProperty(av + '_prox', String(i));
    }
    fechar_(av, form, f);
    props.setProperty(av + '_pronto', '1');
  }
  Logger.log('tudo pronto');
}

function cabecalho_(av, f) {
  const form = FormApp.create('Avaliação de fidelidade das telas ao protótipo (' + av + ')');
  form.setDescription(APRESENTACAO);
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('Obrigado! Suas respostas foram registradas.');
  form.addCheckboxItem().setTitle('Consentimento')
    .setChoiceValues(['Li as informações acima e aceito participar.']).setRequired(true);
  form.addPageBreakItem().setTitle('Sobre você');
  form.addMultipleChoiceItem().setTitle('Formação')
    .setChoiceValues(['Graduação em andamento', 'Graduação concluída', 'Pós-graduação']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Experiência com interface web')
    .setChoiceValues(['Nenhuma', 'Menos de 1 ano', '1 a 3 anos', 'Mais de 3 anos']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Você conhece este TCC ou já viu estas telas antes?')
    .setChoiceValues(['Sim', 'Não']).setRequired(true);
  form.addPageBreakItem().setTitle('Como avaliar').setHelpText(COMO_AVALIAR);
  form.addImageItem().setTitle('Rubrica').setImage(arquivo_(f, 'rubrica.png').getBlob());
  DriveApp.getFileById(form.getId()).moveTo(f);
  return form;
}

function tela_(form, f, c, i, n) {
  form.addPageBreakItem().setTitle('Tela ' + c + ' (' + (i + 1) + ' de ' + n + ')')
    .setHelpText('Compare a tela avaliada (direita) com o protótipo (esquerda).');
  form.addImageItem().setImage(arquivo_(f, c + '.jpg').getBlob());
  form.addMultipleChoiceItem().setTitle('[' + c + '] D1. Estrutura: os elementos do protótipo estão na tela?')
    .setChoiceValues(D1).setRequired(true);
  form.addMultipleChoiceItem().setTitle('[' + c + '] D2. Layout: os elementos estão organizados como no protótipo?')
    .setChoiceValues(D2).setRequired(true);
  form.addMultipleChoiceItem().setTitle('[' + c + '] D3. Estilo visual: cores, fontes e ícones seguem o protótipo?')
    .setChoiceValues(D3).setRequired(true);
  form.addParagraphTextItem().setTitle('[' + c + '] O que mais pesou nas suas notas? (opcional)');
}

function fechar_(av, form, f) {
  form.addPageBreakItem().setTitle('Comentários finais');
  form.addParagraphTextItem().setTitle('Alguma tela foi difícil de avaliar, ou alguma regra ficou confusa? (opcional)');
  const ss = SpreadsheetApp.create('Respostas - avaliação de fidelidade (' + av + ')');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  DriveApp.getFileById(ss.getId()).moveTo(f);
  Logger.log(av + ' | responder: ' + form.getPublishedUrl() + ' | editar: ' + form.getEditUrl() + ' | planilha: ' + ss.getUrl());
}

// Reescreve o texto da página "Como avaliar" nos formulários já criados (inclusão da dica de zoom).
function atualizarInstrucao() {
  const props = PropertiesService.getScriptProperties();
  for (const av of ['A1', 'A2', 'A3']) {
    const id = props.getProperty(av + '_form');
    if (!id) continue;
    const itens = FormApp.openById(id).getItems(FormApp.ItemType.PAGE_BREAK)
      .filter(function (it) { return it.getTitle() === 'Como avaliar'; });
    itens.forEach(function (it) { it.asPageBreakItem().setHelpText(COMO_AVALIAR); });
    Logger.log(av + ': ' + itens.length + ' página(s) atualizada(s)');
  }
}

// Escreve no log todas as respostas, uma linha por dado:
// T|av|n|data   P|av|n|pergunta|resposta   R|av|n|codigo|D1|D2|D3   C|av|n|codigo|comentario   F|av|n|comentario final
function exportarRespostas() {
  const props = PropertiesService.getScriptProperties();
  const limpa = function (s) { return String(s).replace(/[\r\n|]+/g, ' / '); };
  for (const av of ['A1', 'A2', 'A3']) {
    const resps = FormApp.openById(props.getProperty(av + '_form')).getResponses();
    Logger.log('N|' + av + '|' + resps.length);
    resps.forEach(function (r, k) {
      const n = k + 1, notas = {};
      Logger.log('T|' + av + '|' + n + '|' + r.getTimestamp().toISOString());
      r.getItemResponses().forEach(function (ir) {
        const t = ir.getItem().getTitle(), v = ir.getResponse();
        let m = t.match(/^\[(\w{4})\] D([123])\./);
        if (m) { (notas[m[1]] = notas[m[1]] || ['', '', ''])[Number(m[2]) - 1] = String(v).charAt(0); return; }
        m = t.match(/^\[(\w{4})\] O que mais pesou/);
        if (m) { if (String(v).trim()) Logger.log('C|' + av + '|' + n + '|' + m[1] + '|' + limpa(v)); return; }
        if (t.indexOf('Alguma tela foi') === 0) { if (String(v).trim()) Logger.log('F|' + av + '|' + n + '|' + limpa(v)); return; }
        Logger.log('P|' + av + '|' + n + '|' + limpa(t) + '|' + limpa(Array.isArray(v) ? v.join('; ') : v));
      });
      Object.keys(notas).forEach(function (c) { Logger.log('R|' + av + '|' + n + '|' + c + '|' + notas[c].join('|')); });
    });
  }
}

// Mostra os links dos formulários já concluídos.
function links() {
  const props = PropertiesService.getScriptProperties();
  for (const av of ['A1', 'A2', 'A3']) {
    const id = props.getProperty(av + '_form');
    if (!id) { Logger.log(av + ': não criado'); continue; }
    const form = FormApp.openById(id);
    Logger.log(av + ' | pronto: ' + !!props.getProperty(av + '_pronto') + ' | itens: ' + form.getItems().length +
      ' | responder: ' + form.getPublishedUrl() + ' | editar: ' + form.getEditUrl());
  }
}

// Versão antiga, numa execução só (estoura os 6 minutos com 74 telas).
function criar_(av) {
  const f = pasta_();
  const ordens = JSON.parse(arquivo_(f, 'ordens.json').getBlob().getDataAsString());
  const codigos = ordens[av];
  const n = codigos.length;

  const form = FormApp.create('Avaliação de fidelidade das telas ao protótipo (' + av + ')');
  form.setDescription(APRESENTACAO);
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('Obrigado! Suas respostas foram registradas.');
  // Em conta Google Workspace o padrão restringe o formulário ao domínio; os avaliadores são de fora.
  try { form.setRequireLogin(false); } catch (e) { Logger.log('setRequireLogin: ' + e); }

  form.addCheckboxItem().setTitle('Consentimento')
    .setChoiceValues(['Li as informações acima e aceito participar.']).setRequired(true);

  form.addPageBreakItem().setTitle('Sobre você');
  form.addMultipleChoiceItem().setTitle('Formação')
    .setChoiceValues(['Graduação em andamento', 'Graduação concluída', 'Pós-graduação']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Experiência com interface web')
    .setChoiceValues(['Nenhuma', 'Menos de 1 ano', '1 a 3 anos', 'Mais de 3 anos']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Você conhece este TCC ou já viu estas telas antes?')
    .setChoiceValues(['Sim', 'Não']).setRequired(true);

  form.addPageBreakItem().setTitle('Como avaliar').setHelpText(COMO_AVALIAR);
  form.addImageItem().setTitle('Rubrica').setImage(arquivo_(f, 'rubrica.png').getBlob());

  codigos.forEach(function (c, i) {
    form.addPageBreakItem().setTitle('Tela ' + c + ' (' + (i + 1) + ' de ' + n + ')')
      .setHelpText('Compare a tela avaliada (direita) com o protótipo (esquerda).');
    form.addImageItem().setImage(arquivo_(f, c + '.jpg').getBlob());
    form.addMultipleChoiceItem().setTitle('[' + c + '] D1. Estrutura: os elementos do protótipo estão na tela?')
      .setChoiceValues(D1).setRequired(true);
    form.addMultipleChoiceItem().setTitle('[' + c + '] D2. Layout: os elementos estão organizados como no protótipo?')
      .setChoiceValues(D2).setRequired(true);
    form.addMultipleChoiceItem().setTitle('[' + c + '] D3. Estilo visual: cores, fontes e ícones seguem o protótipo?')
      .setChoiceValues(D3).setRequired(true);
    form.addParagraphTextItem().setTitle('[' + c + '] O que mais pesou nas suas notas? (opcional)');
  });

  form.addPageBreakItem().setTitle('Comentários finais');
  form.addParagraphTextItem().setTitle('Alguma tela foi difícil de avaliar, ou alguma regra ficou confusa? (opcional)');

  const ss = SpreadsheetApp.create('Respostas - avaliação de fidelidade (' + av + ')');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  DriveApp.getFileById(form.getId()).moveTo(f);
  DriveApp.getFileById(ss.getId()).moveTo(f);

  Logger.log(av + ' | responder: ' + form.getPublishedUrl() + ' | editar: ' + form.getEditUrl() + ' | planilha: ' + ss.getUrl());
}
