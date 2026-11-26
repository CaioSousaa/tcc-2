import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  boardWithTeam,
  cardTitles,
  countQueries,
  createBoard,
  createCard,
  createList,
  listNames,
  loadBoard,
  registerUser,
  resetDatabase,
  sql,
  startServer,
  stopServer,
} from "./harness";

const count = async (table: string, where = "TRUE", params: unknown[] = []) =>
  Number((await sql<{ c: string }>(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`, params))[0].c);

const positions = async (table: "lists" | "cards", where: string, params: unknown[]) =>
  (await sql<{ position: number }>(`SELECT position FROM ${table} WHERE ${where} ORDER BY position`, params)).map((r) => r.position);

describe("4.3 Listas", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-L1 — criar lista: entra como a terceira, no fim", async () => {
    const { collab, admin, boardId } = await boardWithTeam();
    await createList(admin, boardId, "A fazer");
    await createList(admin, boardId, "Fazendo");
    const res = await collab.api.post(`/boards/${boardId}/lists`, { name: "Revisão" });
    expect(res.status).toBe(201);
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["A fazer", "Fazendo", "Revisão"]);
  });

  it("CA-L2 — nome vazio, só espaços ou acima de 100 é recusado e nada muda", async () => {
    const { admin, boardId } = await boardWithTeam();
    await createList(admin, boardId, "A");
    for (const name of ["", "   ", "x".repeat(101)]) {
      const res = await admin.api.post(`/boards/${boardId}/lists`, { name });
      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("name");
    }
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["A"]);
  });

  it("CA-L3 — renomear: o novo nome aparece para todos e os cards permanecem", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "A fazer");
    await createCard(admin, list, "Card 1");
    expect((await admin.api.patch(`/lists/${list}`, { name: "Backlog" })).status).toBe(200);
    const seen = await loadBoard(observer, boardId);
    expect(listNames(seen)).toEqual(["Backlog"]);
    expect(cardTitles(seen.lists[0])).toEqual(["Card 1"]);
  });

  it("CA-L4 — reordenar [A,B,C]: mover C para o início dá [C,A,B], persistente e igual para todos", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    await createList(admin, boardId, "A");
    await createList(admin, boardId, "B");
    const c = await createList(admin, boardId, "C");

    const res = await admin.api.post(`/lists/${c}/move`, { position: 0 });
    expect(res.status).toBe(200);
    expect(res.body.orderedListIds).toHaveLength(3);

    for (const user of [admin, collab]) expect(listNames(await loadBoard(user, boardId))).toEqual(["C", "A", "B"]);
    expect(await positions("lists", "board_id = $1", [boardId])).toEqual([0, 1, 2]);
  });

  it("CA-L4 / B19 — posição fora do intervalo é ajustada, não rejeitada", async () => {
    const { admin, boardId } = await boardWithTeam();
    const a = await createList(admin, boardId, "A");
    await createList(admin, boardId, "B");
    await createList(admin, boardId, "C");
    expect((await admin.api.post(`/lists/${a}/move`, { position: 999 })).status).toBe(200);
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["B", "C", "A"]);
    expect((await admin.api.post(`/lists/${a}/move`, { position: -5 })).status).toBe(200);
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["A", "B", "C"]);
  });

  it("B18 — mover para a posição em que já está não muda nada", async () => {
    const { admin, boardId } = await boardWithTeam();
    await createList(admin, boardId, "A");
    const b = await createList(admin, boardId, "B");
    await createList(admin, boardId, "C");
    expect((await admin.api.post(`/lists/${b}/move`, { position: 1 })).status).toBe(200);
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["A", "B", "C"]);
  });

  it("CA-L5 — excluir lista vazia remove-a diretamente e fecha o buraco nas posições", async () => {
    const { admin, boardId } = await boardWithTeam();
    await createList(admin, boardId, "A");
    const b = await createList(admin, boardId, "B");
    await createList(admin, boardId, "C");
    expect((await admin.api.del(`/lists/${b}`)).status).toBe(204);
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["A", "C"]);
    expect(await positions("lists", "board_id = $1", [boardId])).toEqual([0, 1]);
  });

  it("CA-L6 — lista com 3 cards: sem confirmação é 409 com a contagem; nada é excluído", async () => {
    const { admin, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "Tarefas");
    for (const t of ["a", "b", "c"]) await createCard(admin, list, t);

    const res = await admin.api.del(`/lists/${list}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("LIST_NOT_EMPTY");
    expect(res.body.error.details).toEqual({ cardCount: 3 });
    expect(await count("lists")).toBe(1);
    expect(await count("cards")).toBe(3);
  });

  it("CA-L6 — confirmando exatamente 3, a lista E os 3 cards (com tudo deles) são excluídos", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "Tarefas");
    const other = await createList(admin, boardId, "Outra");
    const c1 = await createCard(admin, list, "a");
    await createCard(admin, list, "b");
    await createCard(admin, list, "c");
    await createCard(admin, other, "fica");
    await admin.api.post(`/cards/${c1}/comments`, { body: "x" });
    const cl = await admin.api.post(`/cards/${c1}/checklists`, { title: "T" });
    await admin.api.post(`/checklists/${cl.body.id}/items`, { text: "i" });
    await admin.api.put(`/cards/${c1}/assignees/${collab.id}`);

    const res = await admin.api.del(`/lists/${list}?confirmCards=3`);
    expect(res.status).toBe(204);

    const board = await loadBoard(admin, boardId);
    expect(listNames(board)).toEqual(["Outra"]);
    expect(cardTitles(board.lists[0])).toEqual(["fica"]); // B24: cards were NOT moved
    expect(await count("cards")).toBe(1);
    for (const t of ["comments", "checklists", "checklist_items", "card_assignees"]) expect(await count(t), t).toBe(0);
    expect(await positions("lists", "board_id = $1", [boardId])).toEqual([0]);
  });

  it("CA-L6 — confirmação desatualizada (card criado depois do diálogo) é recusada com a contagem atual", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "Tarefas");
    for (const t of ["a", "b", "c"]) await createCard(admin, list, t);
    await createCard(collab, list, "d"); // someone adds a 4th while the dialog was open

    const stale = await admin.api.del(`/lists/${list}?confirmCards=3`);
    expect(stale.status).toBe(409);
    expect(stale.body.error.details.cardCount).toBe(4);
    expect(await count("cards")).toBe(4);

    expect((await admin.api.del(`/lists/${list}?confirmCards=4`)).status).toBe(204);
  });

  it("CA-L6 — confirmar um número maior que o real (cards removidos) também é recusado", async () => {
    const { admin, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "Tarefas");
    const a = await createCard(admin, list, "a");
    await createCard(admin, list, "b");
    await admin.api.del(`/cards/${a}`);
    const res = await admin.api.del(`/lists/${list}?confirmCards=2`);
    expect(res.status).toBe(409);
    expect(res.body.error.details.cardCount).toBe(1);
  });

  it("CA-L7 / B23 — cancelar (a tentativa recusada) não altera lista, cards nem ordem", async () => {
    const { admin, boardId } = await boardWithTeam();
    await createList(admin, boardId, "A");
    const b = await createList(admin, boardId, "B");
    await createList(admin, boardId, "C");
    await createCard(admin, b, "x");
    await admin.api.del(`/lists/${b}`); // 409, user cancels the dialog
    const board = await loadBoard(admin, boardId);
    expect(listNames(board)).toEqual(["A", "B", "C"]);
    expect(cardTitles(board.lists[1])).toEqual(["x"]);
  });

  it("B22 — excluir a última lista do quadro é permitido", async () => {
    const { admin, boardId } = await boardWithTeam();
    const only = await createList(admin, boardId, "Única");
    expect((await admin.api.del(`/lists/${only}`)).status).toBe(204);
    expect((await loadBoard(admin, boardId)).lists).toEqual([]);
  });

  it("CA-L8 — Observador não cria, renomeia, reordena nem exclui listas (403)", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "A");
    expect((await observer.api.post(`/boards/${boardId}/lists`, { name: "x" })).status).toBe(403);
    expect((await observer.api.patch(`/lists/${list}`, { name: "x" })).status).toBe(403);
    expect((await observer.api.post(`/lists/${list}/move`, { position: 0 })).status).toBe(403);
    expect((await observer.api.del(`/lists/${list}`)).status).toBe(403);
    expect(listNames(await loadBoard(admin, boardId))).toEqual(["A"]);
  });

  it("confirmCards inválido (negativo, fracionário, texto) é 400", async () => {
    const { admin, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "A");
    for (const bad of ["-1", "1.5", "abc"]) {
      expect((await admin.api.del(`/lists/${list}?confirmCards=${bad}`)).status, bad).toBe(400);
    }
  });

  it("B7 — agir sobre uma lista que acabou de ser excluída dá 404 e não cria dados órfãos", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "Efêmera");
    await admin.api.del(`/lists/${list}`);
    expect((await collab.api.post(`/lists/${list}/cards`, { title: "órfão" })).status).toBe(404);
    expect((await collab.api.patch(`/lists/${list}`, { name: "x" })).status).toBe(404);
    expect((await collab.api.post(`/lists/${list}/move`, { position: 0 })).status).toBe(404);
    expect(await count("cards")).toBe(0);
  });
});

describe("4.4 Cards", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-K1 — criar card: entra como o último da lista", async () => {
    const { collab, admin, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    await createCard(admin, list, "um");
    await createCard(admin, list, "dois");
    const res = await collab.api.post(`/lists/${list}/cards`, { title: "Escrever testes" });
    expect(res.status).toBe(201);
    expect(cardTitles((await loadBoard(admin, boardId)).lists[0])).toEqual(["um", "dois", "Escrever testes"]);
  });

  it("CA-K2 — título vazio, só espaços ou acima de 200 é recusado (na criação e na edição)", async () => {
    const { admin, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "ok");
    for (const title of ["", "   ", "t".repeat(201)]) {
      expect((await admin.api.post(`/lists/${list}/cards`, { title })).status).toBe(400);
      expect((await admin.api.patch(`/cards/${card}`, { title })).status).toBe(400);
    }
    expect((await admin.api.get(`/cards/${card}`)).body.title).toBe("ok");
    expect((await admin.api.post(`/lists/${list}/cards`, { title: "t".repeat(200) })).status).toBe(201);
  });

  it("CA-K3 — editar título, descrição e prazo; visível ao reabrir e para outros membros", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "velho");
    const res = await admin.api.patch(`/cards/${card}`, { title: "novo", description: "detalhes", dueDate: "2026-06-15" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "novo", description: "detalhes", dueDate: "2026-06-15" });
    const seen = (await observer.api.get(`/cards/${card}`)).body;
    expect(seen).toMatchObject({ title: "novo", description: "detalhes", dueDate: "2026-06-15", boardId });
  });

  it("CA-K3 — a descrição pode ser apagada; descrição acima de 5000 é recusada", async () => {
    const { admin, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "c");
    await admin.api.patch(`/cards/${card}`, { description: "algo" });
    expect((await admin.api.patch(`/cards/${card}`, { description: null })).body.description).toBeNull();
    expect((await admin.api.patch(`/cards/${card}`, { description: "d".repeat(5001) })).status).toBe(400);
    expect((await admin.api.patch(`/cards/${card}`, { description: "d".repeat(5000) })).status).toBe(200);
  });

  it("CA-K4 — mover entre listas: sai da origem, entra no destino na posição, mantém tudo do card", async () => {
    const { admin, boardId } = await boardWithTeam();
    const a = await createList(admin, boardId, "A");
    const b = await createList(admin, boardId, "B");
    const x = await createCard(admin, a, "X");
    await createCard(admin, a, "Y");
    await createCard(admin, b, "P");
    await createCard(admin, b, "Q");
    await admin.api.patch(`/cards/${x}`, { dueDate: "2026-06-15", description: "desc" });
    await admin.api.post(`/cards/${x}/comments`, { body: "c" });
    const cl = await admin.api.post(`/cards/${x}/checklists`, { title: "T" });
    await admin.api.post(`/checklists/${cl.body.id}/items`, { text: "i" });

    const res = await admin.api.post(`/cards/${x}/move`, { listId: b, position: 1 });
    expect(res.status).toBe(200);
    expect(res.body.moved).toHaveLength(2);

    const board = await loadBoard(admin, boardId);
    expect(cardTitles(board.lists[0])).toEqual(["Y"]);
    expect(cardTitles(board.lists[1])).toEqual(["P", "X", "Q"]);
    const moved = board.lists[1].cards[1];
    expect(moved).toMatchObject({ dueDate: "2026-06-15", checklistTotal: 1 });
    expect((await admin.api.get(`/cards/${x}/comments`)).body.items).toHaveLength(1);
    expect(await positions("cards", "list_id = $1", [a])).toEqual([0]);
    expect(await positions("cards", "list_id = $1", [b])).toEqual([0, 1, 2]);
  });

  it("CA-K5 — reordenar na mesma lista [X,Y,Z]: Z para o início dá [Z,X,Y]", async () => {
    const { admin, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    await createCard(admin, l, "X");
    await createCard(admin, l, "Y");
    const z = await createCard(admin, l, "Z");
    const res = await admin.api.post(`/cards/${z}/move`, { listId: l, position: 0 });
    expect(res.status).toBe(200);
    expect(res.body.moved).toHaveLength(1);
    expect(cardTitles((await loadBoard(admin, boardId)).lists[0])).toEqual(["Z", "X", "Y"]);
    expect(await positions("cards", "list_id = $1", [l])).toEqual([0, 1, 2]);
  });

  it("CA-K6 — mover para uma lista vazia", async () => {
    const { admin, boardId } = await boardWithTeam();
    const a = await createList(admin, boardId, "A");
    const empty = await createList(admin, boardId, "Vazia");
    const x = await createCard(admin, a, "X");
    expect((await admin.api.post(`/cards/${x}/move`, { listId: empty, position: 0 })).status).toBe(200);
    const board = await loadBoard(admin, boardId);
    expect(cardTitles(board.lists[0])).toEqual([]);
    expect(cardTitles(board.lists[1])).toEqual(["X"]);
  });

  it("CA-K7 — mover para lista de OUTRO quadro é recusado (422) e o card fica onde estava", async () => {
    const ana = await registerUser("Ana");
    const b1 = await createBoard(ana, "Q1");
    const b2 = await createBoard(ana, "Q2");
    const l1 = await createList(ana, b1, "L1");
    const l2 = await createList(ana, b2, "L2");
    const card = await createCard(ana, l1, "C");
    const res = await ana.api.post(`/cards/${card}/move`, { listId: l2, position: 0 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INVALID_TARGET");
    expect(cardTitles((await loadBoard(ana, b1)).lists[0])).toEqual(["C"]);
  });

  it("CA-K7 — lista de um quadro que a pessoa nem enxerga parece inexistente (404)", async () => {
    const ana = await registerUser("Ana");
    const bruno = await registerUser("Bruno");
    const mine = await createBoard(ana);
    const theirs = await createBoard(bruno);
    const myList = await createList(ana, mine, "L");
    const theirList = await createList(bruno, theirs, "L");
    const card = await createCard(ana, myList, "C");
    expect((await ana.api.post(`/cards/${card}/move`, { listId: theirList, position: 0 })).status).toBe(404);
    expect((await ana.api.post(`/cards/${card}/move`, { listId: "3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f", position: 0 })).status).toBe(404); // B20
  });

  it("B18 / B19 — mover para a própria posição é no-op; posição fora do intervalo é ajustada", async () => {
    const { admin, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    const a = await createCard(admin, l, "A");
    const b = await createCard(admin, l, "B");
    await createCard(admin, l, "C");
    expect((await admin.api.post(`/cards/${b}/move`, { listId: l, position: 1 })).status).toBe(200);
    expect(cardTitles((await loadBoard(admin, boardId)).lists[0])).toEqual(["A", "B", "C"]);
    expect((await admin.api.post(`/cards/${a}/move`, { listId: l, position: 500 })).status).toBe(200);
    expect(cardTitles((await loadBoard(admin, boardId)).lists[0])).toEqual(["B", "C", "A"]);
  });

  it("CA-K8 — excluir card remove tudo dele e fecha o buraco na ordem", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    await createCard(admin, l, "A");
    const b = await createCard(admin, l, "B");
    await createCard(admin, l, "C");
    await admin.api.post(`/cards/${b}/comments`, { body: "x" });
    const cl = await admin.api.post(`/cards/${b}/checklists`, { title: "T" });
    await admin.api.post(`/checklists/${cl.body.id}/items`, { text: "i" });
    await admin.api.put(`/cards/${b}/assignees/${collab.id}`);

    expect((await admin.api.del(`/cards/${b}`)).status).toBe(204);
    expect(cardTitles((await loadBoard(admin, boardId)).lists[0])).toEqual(["A", "C"]);
    expect(await positions("cards", "list_id = $1", [l])).toEqual([0, 1]);
    for (const t of ["comments", "checklists", "checklist_items", "card_assignees"]) expect(await count(t), t).toBe(0);
    expect((await admin.api.get(`/cards/${b}`)).status).toBe(404);
  });

  it("CA-K9 — marcar e desmarcar como concluído", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    const card = await createCard(admin, l, "C");
    expect((await admin.api.patch(`/cards/${card}`, { completed: true })).body.completed).toBe(true);
    expect((await loadBoard(observer, boardId)).lists[0].cards[0].completed).toBe(true);
    expect((await admin.api.patch(`/cards/${card}`, { completed: false })).body.completed).toBe(false);
  });

  it("CA-K10 — Observador não cria, edita, move, exclui nem conclui cards (403)", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    const l2 = await createList(admin, boardId, "L2");
    const card = await createCard(admin, l, "C");
    expect((await observer.api.post(`/lists/${l}/cards`, { title: "x" })).status).toBe(403);
    expect((await observer.api.patch(`/cards/${card}`, { title: "x" })).status).toBe(403);
    expect((await observer.api.patch(`/cards/${card}`, { completed: true })).status).toBe(403);
    expect((await observer.api.post(`/cards/${card}/move`, { listId: l2, position: 0 })).status).toBe(403);
    expect((await observer.api.del(`/cards/${card}`)).status).toBe(403);
    expect((await admin.api.get(`/cards/${card}`)).body).toMatchObject({ title: "C", completed: false, listId: l });
  });

  it("R-12 — board_id e list_id não podem ser alterados por PATCH", async () => {
    const { admin, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    const l2 = await createList(admin, boardId, "L2");
    const card = await createCard(admin, l, "C");
    const res = await admin.api.patch(`/cards/${card}`, { title: "ok", listId: l2, boardId: l2 });
    expect(res.status).toBe(200);
    expect(res.body.listId).toBe(l);
    expect(res.body.boardId).toBe(boardId);
  });

  it("B7 — agir sobre um card excluído por outra pessoa dá 404", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    const card = await createCard(admin, l, "C");
    await admin.api.del(`/cards/${card}`);
    expect((await collab.api.patch(`/cards/${card}`, { title: "x" })).status).toBe(404);
    expect((await collab.api.post(`/cards/${card}/comments`, { body: "x" })).status).toBe(404);
    expect((await collab.api.post(`/cards/${card}/checklists`, { title: "x" })).status).toBe(404);
    expect((await collab.api.del(`/cards/${card}`)).status).toBe(404);
  });

  it("B21 — quadro sem listas e lista sem cards são estados válidos", async () => {
    const { admin, boardId } = await boardWithTeam();
    expect((await loadBoard(admin, boardId)).lists).toEqual([]);
    await createList(admin, boardId, "Vazia");
    expect((await loadBoard(admin, boardId)).lists[0].cards).toEqual([]);
  });
});

describe("Ordenação e concorrência (plano §6.3, B8)", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("B8 — movimentos simultâneos de cards deixam uma ordem única e consistente, sem perda nem duplicata", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const a = await createList(admin, boardId, "A");
    const b = await createList(admin, boardId, "B");
    const cards: string[] = [];
    for (let i = 0; i < 8; i++) cards.push(await createCard(admin, a, `a${i}`));
    for (let i = 0; i < 4; i++) cards.push(await createCard(admin, b, `b${i}`));

    const results = await Promise.all(
      cards.map((id, i) => (i % 2 ? admin : collab).api.post(`/cards/${id}/move`, { listId: i % 3 === 0 ? a : b, position: i % 4 })),
    );
    expect(results.every((r) => r.status === 200)).toBe(true);

    expect(await count("cards")).toBe(12);
    for (const list of [a, b]) {
      const pos = await positions("cards", "list_id = $1", [list]);
      expect(pos).toEqual(pos.map((_, i) => i)); // dense 0..n-1, no duplicates
    }
    const board = await loadBoard(admin, boardId);
    const all = board.lists.flatMap((l: { cards: { id: string }[] }) => l.cards.map((c) => c.id));
    expect([...all].sort()).toEqual([...cards].sort());
  });

  it("B8 — criar cards em paralelo na mesma lista gera posições únicas 0..n-1", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    const res = await Promise.all(
      Array.from({ length: 10 }, (_, i) => (i % 2 ? admin : collab).api.post(`/lists/${l}/cards`, { title: `c${i}` })),
    );
    expect(res.every((r) => r.status === 201)).toBe(true);
    expect(await positions("cards", "list_id = $1", [l])).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("B8 — criar listas e reordenar em paralelo mantém posições densas", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const first = await createList(admin, boardId, "L0");
    await Promise.all([
      ...Array.from({ length: 6 }, (_, i) => admin.api.post(`/boards/${boardId}/lists`, { name: `L${i + 1}` })),
      collab.api.post(`/lists/${first}/move`, { position: 3 }),
    ]);
    const pos = await positions("lists", "board_id = $1", [boardId]);
    expect(pos).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("RN-X2 — excluir a lista enquanto outro cria um card: a contagem confirmada nunca fica desatualizada", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const l = await createList(admin, boardId, "L");
    await createCard(admin, l, "a");
    const [del, add] = await Promise.all([
      admin.api.del(`/lists/${l}?confirmCards=1`),
      collab.api.post(`/lists/${l}/cards`, { title: "b" }),
    ]);
    // Either the delete ran first (card creation then 404) or the card was added first (delete 409).
    if (del.status === 204) {
      expect(add.status).toBe(404);
      expect(await count("cards")).toBe(0);
    } else {
      expect(del.status).toBe(409);
      expect(add.status).toBe(201);
      expect(await count("cards")).toBe(2);
    }
  });

  it("R-32 — carregar o quadro usa um número CONSTANTE de consultas (≤ 8), qualquer que seja o tamanho", async () => {
    const { admin, boardId } = await boardWithTeam();
    const l1 = await createList(admin, boardId, "A");
    const l2 = await createList(admin, boardId, "B");

    const small = await countQueries(() => admin.api.get(`/boards/${boardId}`));
    for (let i = 0; i < 40; i++) {
      const id = await createCard(admin, i % 2 ? l1 : l2, `c${i}`);
      if (i % 5 === 0) {
        const cl = await admin.api.post(`/cards/${id}/checklists`, { title: "T" });
        await admin.api.post(`/checklists/${cl.body.id}/items`, { text: "x" });
      }
    }
    const large = await countQueries(() => admin.api.get(`/boards/${boardId}`));

    // Data statements of the board load itself: every SELECT that is not the session lookup done by
    // requireAuth. (Transaction control — START/SET ISOLATION/COMMIT — is not a data query.)
    const data = (q: string[]) => q.filter((s) => /^\s*SELECT/i.test(s) && !/"Session"/.test(s));
    expect(large.result.body.lists.flatMap((l: { cards: unknown[] }) => l.cards)).toHaveLength(40);
    expect(data(small.queries)).toHaveLength(8);
    expect(data(large.queries)).toHaveLength(8); // same count with 40 cards, checklists and labels
  });
});
