import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { countOverdue, isOverdue } from "../../../front-end/src/lib/dates";
import { cardMatchesFilter, EMPTY_FILTER, type CardFilter } from "../../../front-end/src/lib/filters";
import { progressPercent, progressText } from "../../../front-end/src/lib/progress";
import {
  boardWithTeam,
  createBoard,
  createCard,
  createLabel,
  createList,
  loadBoard,
  registerUser,
  resetDatabase,
  sql,
  startServer,
  stopServer,
} from "./harness";

const count = async (table: string, where = "TRUE", params: unknown[] = []) =>
  Number((await sql<{ c: string }>(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`, params))[0].c);

// A board with one list and one card, plus the team.
async function setup() {
  const team = await boardWithTeam();
  const listId = await createList(team.admin, team.boardId, "L");
  const cardId = await createCard(team.admin, listId, "Card");
  return { ...team, listId, cardId };
}

const summaryOf = async (user: Awaited<ReturnType<typeof boardWithTeam>>["admin"], boardId: string, cardId: string) =>
  (await loadBoard(user, boardId)).lists.flatMap((l: { cards: { id: string }[] }) => l.cards).find((c: { id: string }) => c.id === cardId);

async function checklistWith(user: Awaited<ReturnType<typeof boardWithTeam>>["admin"], cardId: string, title: string, texts: string[]) {
  const cl = await user.api.post(`/cards/${cardId}/checklists`, { title });
  const items: string[] = [];
  for (const text of texts) items.push((await user.api.post(`/checklists/${cl.body.id}/items`, { text })).body.item.id);
  return { checklistId: cl.body.id as string, items };
}

describe("4.5 Checklists e progresso", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-CK1 — checklist 'Entrega' com 4 itens: em ordem de criação, desmarcados, progresso 0/4 (0%)", async () => {
    const { admin, boardId, cardId } = await setup();
    await checklistWith(admin, cardId, "Entrega", ["um", "dois", "três", "quatro"]);

    const detail = (await admin.api.get(`/cards/${cardId}`)).body;
    expect(detail.checklists).toHaveLength(1);
    expect(detail.checklists[0].title).toBe("Entrega");
    expect(detail.checklists[0].items.map((i: { text: string }) => i.text)).toEqual(["um", "dois", "três", "quatro"]);
    expect(detail.checklists[0].items.every((i: { checked: boolean }) => i.checked === false)).toBe(true);
    expect(progressText(detail.checklistChecked, detail.checklistTotal)).toBe("0/4");
    expect(progressPercent(detail.checklistChecked, detail.checklistTotal)).toBe(0);

    const summary = await summaryOf(admin, boardId, cardId);
    expect([summary.checklistChecked, summary.checklistTotal]).toEqual([0, 4]);
  });

  it("CA-CK2 — marcar 1 de 4: 1/4 (25%) no card aberto E na visão do card na lista", async () => {
    const { admin, boardId, cardId } = await setup();
    const { items } = await checklistWith(admin, cardId, "Entrega", ["a", "b", "c", "d"]);
    const res = await admin.api.patch(`/checklist-items/${items[0]}`, { checked: true });
    expect(res.status).toBe(200);
    expect(res.body.progress).toEqual({ checked: 1, total: 4 });

    const detail = (await admin.api.get(`/cards/${cardId}`)).body;
    expect(progressPercent(detail.checklistChecked, detail.checklistTotal)).toBe(25);
    const summary = await summaryOf(admin, boardId, cardId);
    expect(progressPercent(summary.checklistChecked, summary.checklistTotal)).toBe(25);
  });

  it("CA-CK3 — desmarcar volta a 0/4 (0%)", async () => {
    const { admin, cardId } = await setup();
    const { items } = await checklistWith(admin, cardId, "E", ["a", "b", "c", "d"]);
    await admin.api.patch(`/checklist-items/${items[0]}`, { checked: true });
    const res = await admin.api.patch(`/checklist-items/${items[0]}`, { checked: false });
    expect(res.body.progress).toEqual({ checked: 0, total: 4 });
    expect(progressPercent(0, 4)).toBe(0);
  });

  it("CA-CK4 — o progresso agrega todas as checklists: A 1/2 + B 3/3 = 4/5 (80%)", async () => {
    const { admin, boardId, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "A", ["a1", "a2"]);
    const b = await checklistWith(admin, cardId, "B", ["b1", "b2", "b3"]);
    await admin.api.patch(`/checklist-items/${a.items[0]}`, { checked: true });
    for (const item of b.items) await admin.api.patch(`/checklist-items/${item}`, { checked: true });

    const detail = (await admin.api.get(`/cards/${cardId}`)).body;
    expect([detail.checklistChecked, detail.checklistTotal]).toEqual([4, 5]);
    expect(progressPercent(detail.checklistChecked, detail.checklistTotal)).toBe(80);
    const done = (cl: { items: { checked: boolean }[] }) => [cl.items.filter((i) => i.checked).length, cl.items.length];
    expect(done(detail.checklists[0])).toEqual([1, 2]);
    expect(done(detail.checklists[1])).toEqual([3, 3]);

    const summary = await summaryOf(admin, boardId, cardId);
    expect([summary.checklistChecked, summary.checklistTotal]).toEqual([4, 5]);
  });

  it("CA-CK5 — excluir um item marcado (2/4) leva a 1/3 (33%); excluir a checklist tira os itens do cálculo", async () => {
    const { admin, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "A", ["a", "b", "c", "d"]);
    await admin.api.patch(`/checklist-items/${a.items[0]}`, { checked: true });
    await admin.api.patch(`/checklist-items/${a.items[1]}`, { checked: true });

    const del = await admin.api.del(`/checklist-items/${a.items[0]}`);
    expect(del.status).toBe(200);
    expect(del.body.progress).toEqual({ checked: 1, total: 3 });
    expect(progressPercent(1, 3)).toBe(33);

    const b = await checklistWith(admin, cardId, "B", ["x", "y"]);
    expect(b.checklistId).toBeTruthy();
    const delList = await admin.api.del(`/checklists/${a.checklistId}`);
    expect(delList.status).toBe(200);
    expect(delList.body.progress).toEqual({ checked: 0, total: 2 });
    expect(await count("checklist_items", "checklist_id = $1", [a.checklistId])).toBe(0);
  });

  it("CA-CK6 / B26 — sem itens (nem checklist, nem checklist vazia): 0/0, 'sem itens', sem percentual", async () => {
    const { admin, boardId, cardId } = await setup();
    let summary = await summaryOf(admin, boardId, cardId);
    expect([summary.checklistChecked, summary.checklistTotal]).toEqual([0, 0]);
    expect(progressPercent(summary.checklistChecked, summary.checklistTotal)).toBeNull();
    expect(progressText(summary.checklistChecked, summary.checklistTotal)).toBe("sem itens");

    await admin.api.post(`/cards/${cardId}/checklists`, { title: "Vazia" });
    summary = await summaryOf(admin, boardId, cardId);
    expect(progressText(summary.checklistChecked, summary.checklistTotal)).toBe("sem itens");
  });

  it("B27 — excluir o único item marcado de uma checklist com outros leva a 0%, não a 'sem itens'", async () => {
    const { admin, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "A", ["a", "b"]);
    await admin.api.patch(`/checklist-items/${a.items[0]}`, { checked: true });
    const res = await admin.api.del(`/checklist-items/${a.items[0]}`);
    expect(res.body.progress).toEqual({ checked: 0, total: 1 });
    expect(progressPercent(0, 1)).toBe(0);
  });

  it("CA-CK7 — marcar todos os itens (100%) NÃO conclui o card; concluir não mexe nos itens", async () => {
    const { admin, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "A", ["a", "b"]);
    for (const item of a.items) await admin.api.patch(`/checklist-items/${item}`, { checked: true });
    let detail = (await admin.api.get(`/cards/${cardId}`)).body;
    expect(progressPercent(detail.checklistChecked, detail.checklistTotal)).toBe(100);
    expect(detail.completed).toBe(false);

    await admin.api.patch(`/cards/${cardId}`, { completed: true });
    await admin.api.patch(`/checklist-items/${a.items[0]}`, { checked: false });
    detail = (await admin.api.get(`/cards/${cardId}`)).body;
    expect(detail.completed).toBe(true); // unchecking an item does not reopen the card
  });

  it("B28 — percentuais arredondados para baixo: 1/3 = 33%, 2/3 = 66%", async () => {
    const { admin, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "A", ["a", "b", "c"]);
    const first = await admin.api.patch(`/checklist-items/${a.items[0]}`, { checked: true });
    expect(progressPercent(first.body.progress.checked, first.body.progress.total)).toBe(33);
    const second = await admin.api.patch(`/checklist-items/${a.items[1]}`, { checked: true });
    expect(progressPercent(second.body.progress.checked, second.body.progress.total)).toBe(66);
  });

  it("CA-CK8 — texto vazio, só espaços ou acima do limite é recusado (checklist 100, item 200)", async () => {
    const { admin, cardId } = await setup();
    for (const title of ["", "  ", "t".repeat(101)]) {
      expect((await admin.api.post(`/cards/${cardId}/checklists`, { title })).status).toBe(400);
    }
    const cl = await admin.api.post(`/cards/${cardId}/checklists`, { title: "ok" });
    for (const text of ["", "  ", "t".repeat(201)]) {
      expect((await admin.api.post(`/checklists/${cl.body.id}/items`, { text })).status).toBe(400);
    }
    const item = await admin.api.post(`/checklists/${cl.body.id}/items`, { text: "item" });
    expect((await admin.api.patch(`/checklist-items/${item.body.item.id}`, { text: " " })).status).toBe(400);
    expect((await admin.api.get(`/cards/${cardId}`)).body.checklists[0].items[0].text).toBe("item");
  });

  it("CK2 — renomear checklist e editar o texto do item", async () => {
    const { admin, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "Velha", ["x"]);
    expect((await admin.api.patch(`/checklists/${a.checklistId}`, { title: "Nova" })).body.title).toBe("Nova");
    expect((await admin.api.patch(`/checklist-items/${a.items[0]}`, { text: "y" })).body.item.text).toBe("y");
  });

  it("Observador só lê checklists (403 em qualquer escrita); B7: item excluído dá 404", async () => {
    const { admin, observer, cardId } = await setup();
    const a = await checklistWith(admin, cardId, "A", ["a"]);
    expect((await observer.api.post(`/cards/${cardId}/checklists`, { title: "x" })).status).toBe(403);
    expect((await observer.api.patch(`/checklists/${a.checklistId}`, { title: "x" })).status).toBe(403);
    expect((await observer.api.del(`/checklists/${a.checklistId}`)).status).toBe(403);
    expect((await observer.api.post(`/checklists/${a.checklistId}/items`, { text: "x" })).status).toBe(403);
    expect((await observer.api.patch(`/checklist-items/${a.items[0]}`, { checked: true })).status).toBe(403);
    expect((await observer.api.del(`/checklist-items/${a.items[0]}`)).status).toBe(403);
    expect((await observer.api.get(`/cards/${cardId}`)).body.checklists).toHaveLength(1);

    await admin.api.del(`/checklist-items/${a.items[0]}`);
    expect((await admin.api.patch(`/checklist-items/${a.items[0]}`, { checked: true })).status).toBe(404);
  });
});

describe("4.7 Etiquetas e filtro", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-E1 — criar etiqueta 'Urgente' vermelha: disponível no quadro para todos", async () => {
    const { admin, collab, observer, boardId } = await boardWithTeam();
    const res = await collab.api.post(`/boards/${boardId}/labels`, { name: "Urgente", color: "red" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Urgente", color: "red" });
    for (const user of [admin, collab, observer]) {
      expect((await loadBoard(user, boardId)).labels.map((l: { name: string }) => l.name)).toEqual(["Urgente"]);
    }
  });

  it("CA-E2 — nome duplicado no mesmo quadro (sem distinção de caixa) é recusado; em outro quadro é permitido", async () => {
    const { admin, boardId } = await boardWithTeam();
    await createLabel(admin, boardId, "Urgente");
    for (const name of ["urgente", "URGENTE", "  Urgente "]) {
      const res = await admin.api.post(`/boards/${boardId}/labels`, { name, color: "blue" });
      expect(res.status, name).toBe(409);
      expect(res.body.error.code).toBe("LABEL_NAME_IN_USE");
    }
    const other = await createBoard(admin, "Outro");
    expect((await admin.api.post(`/boards/${other}/labels`, { name: "Urgente", color: "red" })).status).toBe(201);
  });

  it("CA-E3 — nome vazio/longo ou cor fora da paleta é recusado", async () => {
    const { admin, boardId } = await boardWithTeam();
    for (const payload of [
      { name: "", color: "red" },
      { name: "   ", color: "red" },
      { name: "x".repeat(31), color: "red" },
      { name: "ok", color: "#ff0000" },
      { name: "ok", color: "vermelho" },
      { name: "ok" },
    ]) {
      expect((await admin.api.post(`/boards/${boardId}/labels`, payload)).status, JSON.stringify(payload)).toBe(400);
    }
    expect((await admin.api.post(`/boards/${boardId}/labels`, { name: "x".repeat(30), color: "pink" })).status).toBe(201);
  });

  it("CA-E4 — aplicar duas etiquetas a um card; remover uma mantém a outra e a etiqueta continua no quadro", async () => {
    const { admin, boardId, cardId } = await setup();
    const urgente = await createLabel(admin, boardId, "Urgente");
    const bug = await createLabel(admin, boardId, "Bug", "orange");
    expect((await admin.api.put(`/cards/${cardId}/labels/${urgente}`)).status).toBe(204);
    expect((await admin.api.put(`/cards/${cardId}/labels/${bug}`)).status).toBe(204);
    expect((await summaryOf(admin, boardId, cardId)).labelIds.sort()).toEqual([urgente, bug].sort());

    expect((await admin.api.del(`/cards/${cardId}/labels/${bug}`)).status).toBe(204);
    expect((await summaryOf(admin, boardId, cardId)).labelIds).toEqual([urgente]);
    expect((await loadBoard(admin, boardId)).labels).toHaveLength(2);
  });

  it("CA-E5 — aplicar a mesma etiqueta de novo não duplica", async () => {
    const { admin, cardId, boardId } = await setup();
    const urgente = await createLabel(admin, boardId, "Urgente");
    await admin.api.put(`/cards/${cardId}/labels/${urgente}`);
    expect((await admin.api.put(`/cards/${cardId}/labels/${urgente}`)).status).toBe(204);
    expect(await count("card_labels", "card_id = $1", [cardId])).toBe(1);
  });

  it("CA-E6 — editar nome/cor reflete em todos os cards que usam a etiqueta", async () => {
    const { admin, listId, boardId } = await setup();
    const label = await createLabel(admin, boardId, "Velha", "red");
    const cards = [await createCard(admin, listId, "c1"), await createCard(admin, listId, "c2"), await createCard(admin, listId, "c3")];
    for (const c of cards) await admin.api.put(`/cards/${c}/labels/${label}`);

    const res = await admin.api.patch(`/labels/${label}`, { name: "Nova", color: "blue" });
    expect(res.status).toBe(200);
    const board = await loadBoard(admin, boardId);
    expect(board.labels).toEqual([{ id: label, name: "Nova", color: "blue" }]);
    expect(board.lists[0].cards.filter((c: { labelIds: string[] }) => c.labelIds.includes(label))).toHaveLength(3);
  });

  it("CA-E6 — renomear para um nome já existente é recusado", async () => {
    const { admin, boardId } = await setup();
    await createLabel(admin, boardId, "A");
    const b = await createLabel(admin, boardId, "B", "green");
    const res = await admin.api.patch(`/labels/${b}`, { name: "a" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("LABEL_NAME_IN_USE");
    expect((await admin.api.patch(`/labels/${b}`, { name: "B" })).status).toBe(200); // same name, same label: fine
  });

  it("CA-E7 — excluir a etiqueta a remove dos cards, que continuam existindo", async () => {
    const { admin, listId, boardId } = await setup();
    const label = await createLabel(admin, boardId, "Urgente");
    const cards = [await createCard(admin, listId, "c1"), await createCard(admin, listId, "c2"), await createCard(admin, listId, "c3")];
    for (const c of cards) await admin.api.put(`/cards/${c}/labels/${label}`);
    const cardsBefore = await count("cards");

    expect((await admin.api.del(`/labels/${label}`)).status).toBe(204);
    const board = await loadBoard(admin, boardId);
    expect(board.labels).toEqual([]);
    expect(board.lists[0].cards.every((c: { labelIds: string[] }) => c.labelIds.length === 0)).toBe(true);
    expect(await count("cards")).toBe(cardsBefore);
    expect(await count("card_labels")).toBe(0);
  });

  it("RN-F1 / B29 — etiqueta de OUTRO quadro, ou já excluída, não pode ser aplicada (404)", async () => {
    const { admin, cardId, boardId } = await setup();
    const other = await createBoard(admin, "Outro");
    const foreign = await createLabel(admin, other, "Estrangeira");
    expect((await admin.api.put(`/cards/${cardId}/labels/${foreign}`)).status).toBe(404);

    const gone = await createLabel(admin, boardId, "Efêmera");
    await admin.api.del(`/labels/${gone}`);
    expect((await admin.api.put(`/cards/${cardId}/labels/${gone}`)).status).toBe(404);
    expect(await count("card_labels")).toBe(0);
  });

  describe("filtro por etiqueta — regras do cliente aplicadas a payloads reais do quadro", () => {
    async function labelledBoard() {
      const { admin, collab, observer, listId, boardId } = await setup();
      const urgente = await createLabel(admin, boardId, "Urgente");
      const bug = await createLabel(admin, boardId, "Bug", "orange");
      const P = await createCard(admin, listId, "P");
      const Q = await createCard(admin, listId, "Q");
      const R = await createCard(admin, listId, "R");
      await createCard(admin, listId, "S");
      await admin.api.put(`/cards/${P}/labels/${urgente}`);
      await admin.api.put(`/cards/${Q}/labels/${bug}`);
      await admin.api.put(`/cards/${R}/labels/${urgente}`);
      await admin.api.put(`/cards/${R}/labels/${bug}`);
      return { admin, collab, observer, boardId, urgente, bug };
    }
    const filterOf = (...ids: string[]): CardFilter => ({ labelIds: new Set(ids), overdueOnly: false });
    const visible = (board: { lists: { cards: { title: string; labelIds: string[]; dueDate: string | null; completed: boolean }[] }[] }, f: CardFilter) =>
      board.lists.flatMap((l) => l.cards).filter((c) => cardMatchesFilter(c, f, "2026-06-10")).map((c) => c.title).sort();

    it("CA-E8 — filtrar por 'Urgente' mostra só os cards que a têm", async () => {
      const { admin, boardId, urgente } = await labelledBoard();
      expect(visible(await loadBoard(admin, boardId), filterOf(urgente))).toEqual(["P", "R"]);
    });

    it("CA-E9 — várias etiquetas: pelo menos uma das selecionadas (P, Q e R; S fica oculto)", async () => {
      const { admin, boardId, urgente, bug } = await labelledBoard();
      expect(visible(await loadBoard(admin, boardId), filterOf(urgente, bug))).toEqual(["P", "Q", "R"]);
    });

    it("CA-E10 — filtro sem resultado: as listas continuam existindo, vazias", async () => {
      const { admin, boardId } = await labelledBoard();
      const gone = await createLabel(admin, boardId, "Ninguém", "gray");
      const board = await loadBoard(admin, boardId);
      expect(visible(board, filterOf(gone))).toEqual([]);
      expect(board.lists).toHaveLength(1);
    });

    it("CA-E11 — limpar o filtro devolve todos os cards", async () => {
      const { admin, boardId } = await labelledBoard();
      expect(visible(await loadBoard(admin, boardId), EMPTY_FILTER)).toEqual(["Card", "P", "Q", "R", "S"]); // "Card" = fixture card without labels
    });

    it("CA-E12 — o filtro é pessoal: o servidor devolve os mesmos dados completos para todos os membros", async () => {
      const { admin, collab, boardId, urgente } = await labelledBoard();
      void urgente;
      const a = await loadBoard(admin, boardId);
      const b = await loadBoard(collab, boardId);
      expect(visible(a, filterOf(urgente))).toEqual(["P", "R"]); // Ana filters...
      expect(visible(b, EMPTY_FILTER)).toEqual(["Card", "P", "Q", "R", "S"]); // ...Bia still sees everything
      expect(b.lists).toEqual(a.lists);
    });

    it("CA-E13 — Observador filtra normalmente, mas não cria/edita/exclui etiquetas (403)", async () => {
      const { observer, boardId, urgente } = await labelledBoard();
      expect(visible(await loadBoard(observer, boardId), filterOf(urgente))).toEqual(["P", "R"]);
      expect((await observer.api.post(`/boards/${boardId}/labels`, { name: "x", color: "red" })).status).toBe(403);
      expect((await observer.api.patch(`/labels/${urgente}`, { name: "x" })).status).toBe(403);
      expect((await observer.api.del(`/labels/${urgente}`)).status).toBe(403);
    });

    it("B30 — etiqueta excluída: sai do payload e, com ela, do filtro", async () => {
      const { admin, boardId, urgente } = await labelledBoard();
      await admin.api.del(`/labels/${urgente}`);
      const board = await loadBoard(admin, boardId);
      expect(board.labels.map((l: { id: string }) => l.id)).not.toContain(urgente);
      expect(board.lists[0].cards.flatMap((c: { labelIds: string[] }) => c.labelIds)).not.toContain(urgente);
    });
  });

  it("Observador não aplica nem remove etiquetas de cards (403)", async () => {
    const { admin, observer, cardId, boardId } = await setup();
    const label = await createLabel(admin, boardId, "L");
    expect((await observer.api.put(`/cards/${cardId}/labels/${label}`)).status).toBe(403);
    await admin.api.put(`/cards/${cardId}/labels/${label}`);
    expect((await observer.api.del(`/cards/${cardId}/labels/${label}`)).status).toBe(403);
  });
});

describe("4.8 Comentários", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-CM1 — comentar: aparece no histórico com nome do autor e data/hora", async () => {
    const { collab, cardId } = await setup();
    const res = await collab.api.post(`/cards/${cardId}/comments`, { body: "Revisei o PR" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ body: "Revisei o PR", author: { id: collab.id, name: "Bia" } });
    expect(new Date(res.body.createdAt).getTime()).toBeGreaterThan(Date.now() - 60_000);

    const list = (await collab.api.get(`/cards/${cardId}/comments`)).body.items;
    expect(list).toHaveLength(1);
    expect(list[0].author.name).toBe("Bia");
  });

  it("CA-CM2 — ordem cronológica crescente (mais antigo primeiro), de vários autores", async () => {
    const { admin, collab, cardId } = await setup();
    await admin.api.post(`/cards/${cardId}/comments`, { body: "primeiro" });
    await new Promise((r) => setTimeout(r, 15));
    await collab.api.post(`/cards/${cardId}/comments`, { body: "segundo" });
    await new Promise((r) => setTimeout(r, 15));
    await admin.api.post(`/cards/${cardId}/comments`, { body: "terceiro" });
    const items = (await admin.api.get(`/cards/${cardId}/comments`)).body.items;
    expect(items.map((c: { body: string }) => c.body)).toEqual(["primeiro", "segundo", "terceiro"]);
    expect(items.map((c: { author: { name: string } }) => c.author.name)).toEqual(["Ana", "Bia", "Ana"]);
  });

  it("CA-CM3 — vazio, só espaços ou acima de 2000 caracteres é recusado", async () => {
    const { admin, cardId } = await setup();
    for (const body of ["", " \n\t ", "c".repeat(2001)]) {
      expect((await admin.api.post(`/cards/${cardId}/comments`, { body })).status).toBe(400);
    }
    expect((await admin.api.post(`/cards/${cardId}/comments`, { body: "c".repeat(2000) })).status).toBe(201);
    expect((await admin.api.get(`/cards/${cardId}/comments`)).body.items).toHaveLength(1);
  });

  it("CA-CM4 — qualquer membro, inclusive Observador, vê todos os comentários", async () => {
    const { admin, observer, cardId } = await setup();
    await admin.api.post(`/cards/${cardId}/comments`, { body: "x" });
    expect((await observer.api.get(`/cards/${cardId}/comments`)).body.items).toHaveLength(1);
  });

  it("CA-CM5 — Observador não comenta (403) e nada é criado", async () => {
    const { observer, cardId } = await setup();
    const res = await observer.api.post(`/cards/${cardId}/comments`, { body: "x" });
    expect(res.status).toBe(403);
    expect(await count("comments")).toBe(0);
  });

  it("CA-CM6 — comentários são imutáveis: não existem rotas de edição nem exclusão", async () => {
    const { admin, cardId } = await setup();
    const created = await admin.api.post(`/cards/${cardId}/comments`, { body: "x" });
    expect((await admin.api.patch(`/comments/${created.body.id}`, { body: "y" })).status).toBe(404);
    expect((await admin.api.del(`/comments/${created.body.id}`)).status).toBe(404);
    expect((await admin.api.patch(`/cards/${cardId}/comments/${created.body.id}`, { body: "y" })).status).toBe(404);
    expect((await admin.api.del(`/cards/${cardId}/comments/${created.body.id}`)).status).toBe(404);
    expect((await admin.api.get(`/cards/${cardId}/comments`)).body.items[0].body).toBe("x");
  });

  it("CA-CM7 — excluir o card, a lista ou o quadro apaga os comentários", async () => {
    const { admin, listId, boardId } = await setup();
    const c1 = await createCard(admin, listId, "1");
    await admin.api.post(`/cards/${c1}/comments`, { body: "x" });
    await admin.api.del(`/cards/${c1}`);
    expect(await count("comments")).toBe(0);

    const c2 = await createCard(admin, listId, "2");
    await admin.api.post(`/cards/${c2}/comments`, { body: "x" });
    await admin.api.del(`/lists/${listId}?confirmCards=2`); // fixture card + c2
    expect(await count("comments")).toBe(0);

    const l3 = await createList(admin, boardId, "L3");
    const c3 = await createCard(admin, l3, "3");
    await admin.api.post(`/cards/${c3}/comments`, { body: "x" });
    await admin.api.del(`/boards/${boardId}`);
    expect(await count("comments")).toBe(0);
  });

  it("CM2 — o autor vem da sessão: authorId/createdAt enviados pelo cliente são ignorados", async () => {
    const { admin, collab, cardId } = await setup();
    const res = await collab.api.post(`/cards/${cardId}/comments`, { body: "x", authorId: admin.id, createdAt: "2001-01-01T00:00:00Z" });
    expect(res.body.author.id).toBe(collab.id);
    expect(new Date(res.body.createdAt).getFullYear()).toBeGreaterThan(2020);
  });

  it("B5 — marcação, acentos e emojis são guardados e devolvidos literalmente", async () => {
    const { admin, cardId } = await setup();
    const body = "<script>alert(1)</script> ação 🚀 & <b>negrito</b>";
    await admin.api.post(`/cards/${cardId}/comments`, { body });
    expect((await admin.api.get(`/cards/${cardId}/comments`)).body.items[0].body).toBe(body);
  });

  it("Quem não é membro não lê nem escreve comentários (404)", async () => {
    const { cardId } = await setup();
    const outsider = await registerUser("Fora");
    expect((await outsider.api.get(`/cards/${cardId}/comments`)).status).toBe(404);
    expect((await outsider.api.post(`/cards/${cardId}/comments`, { body: "x" })).status).toBe(404);
  });
});

describe("4.9 Prazos e atraso (hoje = 10/06/2026)", () => {
  const TODAY = "2026-06-10";
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  const overdue = async (user: Awaited<ReturnType<typeof boardWithTeam>>["admin"], boardId: string, cardId: string, today = TODAY) => {
    const c = await summaryOf(user, boardId, cardId);
    return isOverdue(c.dueDate, c.completed, today);
  };

  it("CA-P1 — definir prazo 15/06: o card exibe o prazo e não está atrasado", async () => {
    const { admin, boardId, cardId } = await setup();
    const res = await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-15" });
    expect(res.status).toBe(200);
    expect((await summaryOf(admin, boardId, cardId)).dueDate).toBe("2026-06-15");
    expect(await overdue(admin, boardId, cardId)).toBe(false);
  });

  it("CA-P2 — prazo 09/06 sem concluir: atrasado (na lista e no card aberto)", async () => {
    const { admin, boardId, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-09" });
    expect(await overdue(admin, boardId, cardId)).toBe(true);
    const detail = (await admin.api.get(`/cards/${cardId}`)).body;
    expect(isOverdue(detail.dueDate, detail.completed, TODAY)).toBe(true);
  });

  it("CA-P3 — prazo igual a hoje (10/06): NÃO está atrasado", async () => {
    const { admin, boardId, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-10" });
    expect(await overdue(admin, boardId, cardId)).toBe(false);
  });

  it("CA-P4 — com o dia 11/06, o card de prazo 10/06 passa a atrasado sem nenhuma edição", async () => {
    const { admin, boardId, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-10" });
    expect(await overdue(admin, boardId, cardId, "2026-06-10")).toBe(false);
    expect(await overdue(admin, boardId, cardId, "2026-06-11")).toBe(true);
  });

  it("CA-P5 — concluído não é atrasado; reabrir volta a ser", async () => {
    const { admin, boardId, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-09", completed: true });
    expect(await overdue(admin, boardId, cardId)).toBe(false);
    await admin.api.patch(`/cards/${cardId}`, { completed: false });
    expect(await overdue(admin, boardId, cardId)).toBe(true);
  });

  it("CA-P6 — sem prazo nunca é atrasado", async () => {
    const { admin, boardId, cardId } = await setup();
    expect(await overdue(admin, boardId, cardId, "2099-01-01")).toBe(false);
  });

  it("CA-P7 / B34 — mover o prazo para 12/06 ou removê-lo deixa de ser atrasado", async () => {
    const { admin, boardId, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-09" });
    expect(await overdue(admin, boardId, cardId)).toBe(true);
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-12" });
    expect(await overdue(admin, boardId, cardId)).toBe(false);
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-09" });
    const removed = await admin.api.patch(`/cards/${cardId}`, { dueDate: null });
    expect(removed.body.dueDate).toBeNull();
    expect(await overdue(admin, boardId, cardId)).toBe(false);
  });

  it("CA-P8 / B33 — o quadro conta 3 atrasados e sabe quais são; concluídos não entram", async () => {
    const { admin, listId, boardId } = await setup();
    const mk = async (title: string, dueDate: string | null, completed = false) => {
      const id = await createCard(admin, listId, title);
      await admin.api.patch(`/cards/${id}`, { dueDate, completed });
      return id;
    };
    await mk("a1", "2026-06-01");
    await mk("a2", "2026-06-05");
    await mk("a3", "2026-06-09");
    await mk("feito", "2026-06-02", true);
    await mk("hoje", "2026-06-10");
    await mk("futuro", "2026-06-30");
    await mk("sem prazo", null);

    const board = await loadBoard(admin, boardId);
    const cards = board.lists.flatMap((l: { cards: { title: string; dueDate: string | null; completed: boolean }[] }) => l.cards);
    expect(countOverdue(cards, TODAY)).toBe(3);
    expect(cards.filter((c: { dueDate: string | null; completed: boolean }) => isOverdue(c.dueDate, c.completed, TODAY)).map((c: { title: string }) => c.title).sort()).toEqual(["a1", "a2", "a3"]);
  });

  it("CA-P9 — data inválida (31/02, formato errado, com hora) é recusada e o prazo anterior é mantido", async () => {
    const { admin, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-15" });
    for (const dueDate of ["2026-02-31", "2025-02-29", "15/06/2026", "amanhã", "2026-06-15T10:00:00Z", "", 20260615]) {
      const res = await admin.api.patch(`/cards/${cardId}`, { dueDate });
      expect(res.status, String(dueDate)).toBe(400);
      expect(res.body.error.fields).toHaveProperty("dueDate");
    }
    expect((await admin.api.get(`/cards/${cardId}`)).body.dueDate).toBe("2026-06-15");
    expect((await admin.api.patch(`/cards/${cardId}`, { dueDate: "2024-02-29" })).status).toBe(200); // leap day
  });

  it("CA-P10 / RN-D4 — prazo no passado é aceito e o card já nasce atrasado", async () => {
    const { admin, boardId, cardId } = await setup();
    expect((await admin.api.patch(`/cards/${cardId}`, { dueDate: "2020-01-01" })).status).toBe(200);
    expect(await overdue(admin, boardId, cardId)).toBe(true);
  });

  it("CA-P11 — mover o card de lista não altera o atraso nem o prazo", async () => {
    const { admin, boardId, cardId } = await setup();
    const other = await createList(admin, boardId, "Outra");
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-09" });
    await admin.api.post(`/cards/${cardId}/move`, { listId: other, position: 0 });
    expect((await summaryOf(admin, boardId, cardId)).dueDate).toBe("2026-06-09");
    expect(await overdue(admin, boardId, cardId)).toBe(true);
  });

  it("RN-D3 — o prazo é uma data sem hora: volta exatamente como foi gravado, em qualquer fuso do servidor", async () => {
    const { admin, cardId } = await setup();
    for (const date of ["2026-01-01", "2026-03-08", "2026-10-25", "2026-12-31"]) {
      await admin.api.patch(`/cards/${cardId}`, { dueDate: date });
      expect((await admin.api.get(`/cards/${cardId}`)).body.dueDate).toBe(date);
    }
    const [row] = await sql<{ due_date: string }>("SELECT due_date FROM cards");
    expect(row.due_date).toBe("2026-12-31");
  });

  it("Observador vê o prazo, mas não o altera (403)", async () => {
    const { admin, observer, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2026-06-09" });
    expect((await observer.api.get(`/cards/${cardId}`)).body.dueDate).toBe("2026-06-09");
    expect((await observer.api.patch(`/cards/${cardId}`, { dueDate: null })).status).toBe(403);
  });

  it("API não calcula 'atrasado': o cálculo é do cliente (RN-D3, R-30)", async () => {
    const { admin, boardId, cardId } = await setup();
    await admin.api.patch(`/cards/${cardId}`, { dueDate: "2020-01-01" });
    const summary = await summaryOf(admin, boardId, cardId);
    expect(summary).not.toHaveProperty("isOverdue");
    expect(summary).not.toHaveProperty("overdue");
  });
});
