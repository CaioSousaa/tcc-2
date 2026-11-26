"""Análise da avaliação externa de fidelidade ao protótipo.

Uso: python3 analise.py   (só biblioteca padrão; lê os arquivos desta pasta)

Calcula:
  - kappa ponderado de Cohen (pesos lineares e quadráticos) para cada par de avaliadores;
  - comparação entre a média dos avaliadores e as notas do autor (diferença média e Spearman);
  - fidelidade por execução (média das dez telas, tela ausente = 0) e o índice composto
    (média simples da taxa de requisitos aprovados e da fidelidade), como nas Tabelas 6, 7 e 8 do TCC.
  As notas do autor vêm do coleta.md, na raiz do repositório.
"""
import csv
import itertools
import re
import os
import statistics as st

AQUI = os.path.dirname(os.path.abspath(__file__))
AVALIADORES = ['A1', 'A2', 'A3']
DIMENSOES = ['D1', 'D2', 'D3']
TELAS = ['tela-login', 'criar-conta', 'meus-quadros', 'quadro', 'novo-quadro', 'criar-nova-lista',
         'detalhe-card', 'etiquetas', 'membros', 'excluir-lista']
# Taxa de requisitos aprovados de cada execução (coleta.md, quadro-resumo consolidado).
TAXA = {'VIBECODE-HAIKU': 30, 'VIBECODE-SONNET': 40, 'VIBECODE-OPUS': 60,
        'SDD-HAIKU': 50, 'SDD-SONNET': 70, 'SDD-OPUS': 100,
        'SELFPLANNING-HAIKU': 60, 'SELFPLANNING-SONNET': 70, 'SELFPLANNING-OPUS': 80}


def notas_do_autor():
    """Lê as notas de fidelidade do autor nas tabelas "C) Fidelidade ao protótipo" do coleta.md."""
    with open(os.path.join(AQUI, '..', 'coleta.md'), encoding='utf-8') as fh:
        texto = fh.read()
    num = lambda s: float(s.replace('*', '').replace('%', '').replace(',', '.').strip())
    autor = {}
    for execucao, secao in zip(TAXA, re.split(r'^### ', texto, flags=re.M)[1:]):
        m = re.search(r'\*\*C\) Fidelidade ao protótipo\*\*(.*?)\*\*Nota de fidelidade da execução:\*\*\s*([^\n]*)', secao, re.S)
        telas = {}
        for linha in m.group(1).splitlines():
            c = [x.strip() for x in linha.strip().strip('|').split('|')]
            if len(c) == 5 and c[1][:1].isdigit():
                telas[c[0].replace(' (modal)', '')] = {'D1': num(c[1]), 'D2': num(c[2]), 'D3': num(c[3]), 'nota': num(c[4])}
        autor[execucao] = {'nota_execucao': num(re.search(r'([\d,]+)%', m.group(2)).group(1)), 'telas': telas}
    return autor


def ler():
    notas = {a: {} for a in AVALIADORES}
    with open(os.path.join(AQUI, 'respostas.csv'), encoding='utf-8') as fh:
        for r in csv.DictReader(fh):
            notas[r['avaliador']][r['codigo']] = [int(r[d]) for d in DIMENSOES]
    with open(os.path.join(AQUI, 'chave.csv'), encoding='utf-8') as fh:
        chave = {r['codigo']: (r['execucao'], r['tela']) for r in csv.DictReader(fh)}
    return notas, chave, notas_do_autor()


def kappa_ponderado(a, b, pesos, k=3):
    n = len(a)
    obs = [[0] * k for _ in range(k)]
    for x, y in zip(a, b):
        obs[x][y] += 1
    pa = [sum(obs[i]) / n for i in range(k)]
    pb = [sum(obs[i][j] for i in range(k)) / n for j in range(k)]
    expoente = 1 if pesos == 'linear' else 2
    w = [[(abs(i - j) / (k - 1)) ** expoente for j in range(k)] for i in range(k)]
    d_obs = sum(w[i][j] * obs[i][j] / n for i in range(k) for j in range(k))
    d_esp = sum(w[i][j] * pa[i] * pb[j] for i in range(k) for j in range(k))
    return 1 - d_obs / d_esp


def postos(v):
    ordem = sorted(range(len(v)), key=lambda i: v[i])
    r = [0.0] * len(v)
    i = 0
    while i < len(ordem):
        j = i
        while j + 1 < len(ordem) and v[ordem[j + 1]] == v[ordem[i]]:
            j += 1
        for t in range(i, j + 1):
            r[ordem[t]] = (i + j) / 2 + 1
        i = j + 1
    return r


def spearman(x, y):
    rx, ry = postos(x), postos(y)
    mx, my = st.mean(rx), st.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    return num / (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5


def faixa(x):
    return 'Alto' if x >= 75 else 'Intermediário' if x >= 50 else 'Baixo'


def main():
    notas, chave, autor = ler()
    codigos = sorted(chave)

    print('Concordância entre avaliadores (kappa ponderado de Cohen, por par)')
    for pesos in ('linear', 'quadratico'):
        for nome, dims in (('D1+D2+D3', (0, 1, 2)), ('D1', (0,)), ('D2', (1,)), ('D3', (2,))):
            ks = []
            for a, b in itertools.combinations(AVALIADORES, 2):
                va = [notas[a][c][d] for c in codigos for d in dims]
                vb = [notas[b][c][d] for c in codigos for d in dims]
                ks.append(kappa_ponderado(va, vb, pesos))
            print(f'  {pesos:10} {nome:9} pares: {", ".join(f"{k:.3f}" for k in ks)}  média: {st.mean(ks):.3f}')
    iguais = sum(len({notas[a][c][d] for a in AVALIADORES}) == 1 for c in codigos for d in range(3))
    print(f'  notas iguais nos três avaliadores: {iguais}/{len(codigos) * 3} ({iguais / (len(codigos) * 3):.1%})')

    media = {c: sum(st.mean(notas[a][c][d] for a in AVALIADORES) for d in range(3)) / 6 * 100 for c in codigos}
    nota_autor = {c: autor[chave[c][0]]['telas'][chave[c][1]]['nota'] for c in codigos}
    print(f'\nAutor x média dos avaliadores ({len(codigos)} telas avaliadas)')
    print(f'  nota média por tela: autor {st.mean(nota_autor.values()):.2f}%, avaliadores {st.mean(media.values()):.2f}%')
    print(f'  Spearman entre as notas por tela: {spearman([nota_autor[c] for c in codigos], [media[c] for c in codigos]):.3f}')
    for d, nome in enumerate(DIMENSOES):
        dif = st.mean(autor[chave[c][0]]['telas'][chave[c][1]][nome] - st.mean(notas[a][c][d] for a in AVALIADORES) for c in codigos)
        print(f'  {nome}: diferença média autor - avaliadores = {dif:+.3f} ponto')

    por_tela = {v: k for k, v in chave.items()}
    print('\nFidelidade e índice por execução (tela ausente = 0)')
    print(f'  {"execução":20} {"fid. autor":>10} {"fid. aval.":>10} {"índ. autor":>10} {"índ. aval.":>10}  faixa')
    fa, fv = {}, {}
    for e in TAXA:
        fa[e] = autor[e]['nota_execucao']
        fv[e] = st.mean(media[por_tela[(e, t)]] if (e, t) in por_tela else 0.0 for t in TELAS)
        ia, iv = (TAXA[e] + fa[e]) / 2, (TAXA[e] + fv[e]) / 2
        print(f'  {e:20} {fa[e]:9.2f}% {fv[e]:9.2f}% {ia:10.2f} {iv:10.2f}  {faixa(ia)} / {faixa(iv)}')
    print(f'  Spearman entre as execuções: {spearman(list(fa.values()), list(fv.values())):.3f}')


if __name__ == '__main__':
    main()
