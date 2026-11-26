# Avaliação externa da fidelidade ao protótipo

Dados da avaliação em que três pessoas que não participaram do trabalho deram notas à fidelidade das telas de cada execução ao protótipo de referência (Seção 4.3.3 e Tabela 8 do TCC).

## Procedimento

- As telas de cada execução foram capturadas com a aplicação rodando a partir do código deste repositório. Cada captura foi montada ao lado da tela correspondente do protótipo (`protoripo.pen`, na raiz) e recebeu um código aleatório de quatro caracteres, sem indicação de metodologia nem de modelo.
- Cada avaliador respondeu a um formulário do Google Forms com as 74 telas existentes, em uma ordem embaralhada própria, e deu uma nota inteira de 0 a 2 em cada dimensão: D1 (estrutura), D2 (layout) e D3 (estilo visual).
- As 16 telas que não existiam ou não abriam nas execuções com o Claude Haiku 4.5 não foram mostradas e entram com nota zero (`telas-ausentes.csv`).
- Os avaliadores aparecem só como A1, A2 e A3.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `respostas.csv` | Notas de cada avaliador por tela: avaliador, posição em que a tela apareceu no formulário, código, D1, D2 e D3. |
| `chave.csv` | Execução e tela de cada código. |
| `telas-ausentes.csv` | Telas que não foram avaliadas e recebem nota zero. |
| `ordens.json` | Ordem das telas no formulário de cada avaliador. |
| `imagens/` | As 74 imagens mostradas aos avaliadores (protótipo à esquerda, tela da execução à direita) e a rubrica. |
| `formulario/Code.gs` | Script do Google Apps Script que montou os formulários. |
| `analise.py` | Cálculo da concordância, da comparação com o autor e das tabelas. |

## Como reproduzir a análise

```
python3 analise.py
```

O script usa apenas a biblioteca padrão do Python e lê as notas do autor no `coleta.md`, na raiz do repositório. Ele calcula o kappa ponderado de Cohen para cada par de avaliadores, compara a média dos avaliadores com as notas do autor pela diferença média e pela correlação de Spearman e recalcula a fidelidade e o índice composto de cada execução.
