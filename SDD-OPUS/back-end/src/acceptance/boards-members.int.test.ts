import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  boardWithTeam,
  createBoard,
  createCard,
  createLabel,
  createList,
  invite,
  loadBoard,
  registerUser,
  resetDatabase,
  sql,
  startServer,
  stopServer,
} from "./harness";

const count = async (table: string, where = "TRUE", params: unknown[] = []) =>
  Number((await sql<{ c: string }>(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`, params))[0].c);

describe("4.2 Quadros", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-Q1 — criar quadro: aparece na lista com papel Administrador e sem listas", async () => {
    const ana = await registerUser("Ana");
    const created = await ana.api.post("/boards", { name: "Sprint 1" });
    expect(created.status).toBe(201);

    const list = await ana.api.get("/boards");
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({ name: "Sprint 1", role: "admin", memberCount: 1 });

    const board = await loadBoard(ana, created.body.id);
    expect(board.lists).toEqual([]);
    expect(board.role).toBe("admin");
  });

  it("CA-Q2 — nome vazio ou só espaços é recusado", async () => {
    const ana = await registerUser("Ana");
    for (const name of ["", "   "]) {
      const res = await ana.api.post("/boards", { name });
      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("name");
    }
    expect((await ana.api.get("/boards")).body.items).toEqual([]);
  });

  it("CA-Q2 — descrição acima de 500 caracteres é recusada; nome acima de 100 também", async () => {
    const ana = await registerUser("Ana");
    expect((await ana.api.post("/boards", { name: "x", description: "d".repeat(501) })).status).toBe(400);
    expect((await ana.api.post("/boards", { name: "n".repeat(101) })).status).toBe(400);
    expect((await ana.api.post("/boards", { name: "n".repeat(100), description: "d".repeat(500) })).status).toBe(201);
  });

  it("CA-Q3 — isolamento: quem não é membro não vê, nem abre, nem altera o quadro (404)", async () => {
    const ana = await registerUser("Ana");
    const bruno = await registerUser("Bruno");
    const boardId = await createBoard(ana, "Secreto");

    expect((await bruno.api.get("/boards")).body.items).toEqual([]);
    for (const [method, path, body] of [
      ["GET", `/boards/${boardId}`, undefined],
      ["GET", `/boards/${boardId}/members`, undefined],
      ["PATCH", `/boards/${boardId}`, { name: "invadido" }],
      ["DELETE", `/boards/${boardId}`, undefined],
      ["POST", `/boards/${boardId}/lists`, { name: "x" }],
      ["POST", `/boards/${boardId}/members`, { email: "a@ex.com", role: "observer" }],
      ["POST", `/boards/${boardId}/labels`, { name: "x", color: "red" }],
    ] as const) {
      const res = await bruno.api.call(method, path, body);
      expect(res.status, `${method} ${path}`).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    }
    expect((await loadBoard(ana, boardId)).name).toBe("Secreto");
  });

  it("CA-Q3 / B12 — 'não existe' e 'não é seu' têm resposta idêntica; id malformado é 404, não 500", async () => {
    const ana = await registerUser("Ana");
    const bruno = await registerUser("Bruno");
    const boardId = await createBoard(ana);
    const notYours = await bruno.api.get(`/boards/${boardId}`);
    const missing = await bruno.api.get("/boards/3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f");
    const malformed = await bruno.api.get("/boards/nao-e-uuid");
    expect(notYours.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(notYours.body).toEqual(missing.body);
  });

  it("CA-Q4 — o Administrador edita nome e descrição, e todos os membros veem", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const res = await admin.api.patch(`/boards/${boardId}`, { name: "Novo nome", description: "Nova descrição" });
    expect(res.status).toBe(200);
    const seen = await loadBoard(collab, boardId);
    expect(seen).toMatchObject({ name: "Novo nome", description: "Nova descrição" });

    const cleared = await admin.api.patch(`/boards/${boardId}`, { description: null });
    expect(cleared.body.description).toBeNull();
  });

  it("CA-Q5 — Colaborador e Observador não editam nem excluem o quadro (403) e nada muda", async () => {
    const { collab, observer, boardId } = await boardWithTeam();
    for (const user of [collab, observer]) {
      const edit = await user.api.patch(`/boards/${boardId}`, { name: "hack" });
      expect(edit.status).toBe(403);
      expect(edit.body.error.code).toBe("FORBIDDEN");
      expect((await user.api.del(`/boards/${boardId}`)).status).toBe(403);
    }
    const board = await loadBoard(collab, boardId);
    expect(board.name).toBe("Sprint 1");
  });

  it("CA-Q6 / RN-X1 — excluir o quadro remove tudo e some para todos os membros", async () => {
    const { admin, collab, observer, boardId } = await boardWithTeam();
    const l1 = await createList(admin, boardId, "A fazer");
    const l2 = await createList(admin, boardId, "Feito");
    const c1 = await createCard(admin, l1, "Card 1");
    await createCard(admin, l2, "Card 2");
    const label = await createLabel(admin, boardId, "Urgente");
    await admin.api.put(`/cards/${c1}/labels/${label}`);
    await admin.api.put(`/cards/${c1}/assignees/${collab.id}`);
    await admin.api.post(`/cards/${c1}/comments`, { body: "oi" });
    const cl = await admin.api.post(`/cards/${c1}/checklists`, { title: "Entrega" });
    await admin.api.post(`/checklists/${cl.body.id}/items`, { text: "item" });

    const res = await admin.api.del(`/boards/${boardId}`);
    expect(res.status).toBe(204);

    for (const user of [admin, collab, observer]) {
      expect((await user.api.get("/boards")).body.items).toEqual([]);
      expect((await user.api.get(`/boards/${boardId}`)).status).toBe(404); // B36
    }
    for (const table of ["boards", "board_members", "lists", "cards", "labels", "card_labels", "card_assignees", "checklists", "checklist_items", "comments"]) {
      expect(await count(table), table).toBe(0);
    }
    expect(await count("users")).toBe(3); // accounts survive
  });

  it("Q1 — a lista mostra só os quadros dos quais a pessoa é membro, com o papel de cada um", async () => {
    const ana = await registerUser("Ana");
    const bia = await registerUser("Bia");
    const own = await createBoard(bia, "Da Bia");
    const shared = await createBoard(ana, "Da Ana");
    await invite(ana, shared, bia, "observer");
    await createBoard(ana, "Só da Ana");

    const items = (await bia.api.get("/boards")).body.items;
    expect(items.map((b: { name: string }) => b.name).sort()).toEqual(["Da Ana", "Da Bia"]);
    expect(items.find((b: { id: string }) => b.id === own).role).toBe("admin");
    expect(items.find((b: { id: string }) => b.id === shared).role).toBe("observer");
    expect(items.find((b: { id: string }) => b.id === shared).memberCount).toBe(2);
  });
});

describe("4.6 Membros, papéis e responsáveis", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-M1 — convidar: a pessoa passa a ver o quadro com o papel escolhido e aparece nos membros", async () => {
    const ana = await registerUser("Ana");
    const bia = await registerUser("Bia");
    const boardId = await createBoard(ana);

    const res = await ana.api.post(`/boards/${boardId}/members`, { email: bia.email, role: "collaborator" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ userId: bia.id, role: "collaborator", email: bia.email });

    const boards = (await bia.api.get("/boards")).body.items;
    expect(boards[0]).toMatchObject({ id: boardId, role: "collaborator" });
    const members = (await ana.api.get(`/boards/${boardId}/members`)).body.items;
    expect(members.map((m: { userId: string }) => m.userId).sort()).toEqual([ana.id, bia.id].sort());
  });

  it("CA-M2 — e-mail sem conta é recusado com mensagem clara", async () => {
    const ana = await registerUser("Ana");
    const boardId = await createBoard(ana);
    const res = await ana.api.post(`/boards/${boardId}/members`, { email: "ninguem@ex.com", role: "observer" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("CA-M3 / B15 — convidar quem já é membro, ou a si mesmo, é recusado", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const again = await admin.api.post(`/boards/${boardId}/members`, { email: collab.email, role: "observer" });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("ALREADY_MEMBER");
    const self = await admin.api.post(`/boards/${boardId}/members`, { email: admin.email, role: "admin" });
    expect(self.status).toBe(409);
    expect(self.body.error.code).toBe("ALREADY_MEMBER");
  });

  it("B38 — convidar com o e-mail em outra caixa encontra a conta", async () => {
    const ana = await registerUser("Ana");
    const bia = await registerUser("Bia");
    const boardId = await createBoard(ana);
    const res = await ana.api.post(`/boards/${boardId}/members`, { email: `  ${bia.email.toUpperCase()} `, role: "observer" });
    expect(res.status).toBe(201);
  });

  it("CA-M1 — papel inválido no convite é recusado", async () => {
    const ana = await registerUser("Ana");
    const bia = await registerUser("Bia");
    const boardId = await createBoard(ana);
    const res = await ana.api.post(`/boards/${boardId}/members`, { email: bia.email, role: "dono" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("role");
  });

  it("CA-M4 / B10 — rebaixar um membro tem efeito imediato nas permissões", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const listId = await createList(collab, boardId, "Lista"); // collaborator can edit
    expect(listId).toBeTruthy();

    const res = await admin.api.patch(`/boards/${boardId}/members/${collab.id}`, { role: "observer" });
    expect(res.status).toBe(200);

    const denied = await collab.api.post(`/boards/${boardId}/lists`, { name: "Outra" });
    expect(denied.status).toBe(403);
    expect((await collab.api.get(`/boards/${boardId}`)).status).toBe(200); // still reads
  });

  it("CA-M5 / B16 — o último Administrador não pode ser rebaixado nem removido", async () => {
    const { admin, boardId } = await boardWithTeam();
    const demote = await admin.api.patch(`/boards/${boardId}/members/${admin.id}`, { role: "collaborator" });
    expect(demote.status).toBe(409);
    expect(demote.body.error.code).toBe("LAST_ADMIN");
    const remove = await admin.api.del(`/boards/${boardId}/members/${admin.id}`);
    expect(remove.status).toBe(409);
    expect(remove.body.error.code).toBe("LAST_ADMIN");
    expect((await loadBoard(admin, boardId)).role).toBe("admin");
  });

  it("CA-M6 — promover a Administrador dá poder de gestão, e o primeiro pode então sair", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    expect((await admin.api.patch(`/boards/${boardId}/members/${collab.id}`, { role: "admin" })).status).toBe(200);
    const members = (await collab.api.get(`/boards/${boardId}/members`)).body.items;
    expect(members.filter((m: { role: string }) => m.role === "admin")).toHaveLength(2);

    expect((await collab.api.post(`/boards/${boardId}/members`, { email: "zz@ex.com", role: "observer" })).status).toBe(422); // allowed, just no such user
    expect((await admin.api.del(`/boards/${boardId}/members/${admin.id}`)).status).toBe(204);
    expect((await admin.api.get(`/boards/${boardId}`)).status).toBe(404);
  });

  it("CA-M5 — dois administradores que se rebaixam ao mesmo tempo não zeram os administradores", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    await admin.api.patch(`/boards/${boardId}/members/${collab.id}`, { role: "admin" });

    const [a, b] = await Promise.all([
      admin.api.patch(`/boards/${boardId}/members/${admin.id}`, { role: "observer" }),
      collab.api.patch(`/boards/${boardId}/members/${collab.id}`, { role: "observer" }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await count("board_members", "board_id = $1 AND role = 'admin'", [boardId])).toBe(1);
  });

  it("CA-M7 — Colaborador e Observador não gerenciam membros", async () => {
    const { collab, observer, boardId } = await boardWithTeam();
    const extra = await registerUser("Dani");
    for (const user of [collab, observer]) {
      expect((await user.api.post(`/boards/${boardId}/members`, { email: extra.email, role: "observer" })).status).toBe(403);
      expect((await user.api.patch(`/boards/${boardId}/members/${collab.id}`, { role: "admin" })).status).toBe(403);
      expect((await user.api.del(`/boards/${boardId}/members/${collab.id}`)).status).toBe(403);
    }
    expect(await count("board_members", "board_id = $1", [boardId])).toBe(3);
  });

  it("M3 — qualquer membro, inclusive Observador, vê a lista de membros e papéis", async () => {
    const { observer, boardId } = await boardWithTeam();
    const res = await observer.api.get(`/boards/${boardId}/members`);
    expect(res.status).toBe(200);
    expect(res.body.items.map((m: { role: string }) => m.role).sort()).toEqual(["admin", "collaborator", "observer"]);
  });

  it("CA-M8 / RN-X6 — remover membro: perde o acesso, perde as atribuições, mantém os comentários", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const c1 = await createCard(admin, list, "C1");
    const c2 = await createCard(admin, list, "C2");
    const c3 = await createCard(admin, list, "C3");
    await admin.api.put(`/cards/${c1}/assignees/${collab.id}`);
    await admin.api.put(`/cards/${c2}/assignees/${collab.id}`);
    await admin.api.put(`/cards/${c2}/assignees/${admin.id}`);
    await collab.api.post(`/cards/${c3}/comments`, { body: "Revisei" });

    expect((await admin.api.del(`/boards/${boardId}/members/${collab.id}`)).status).toBe(204);

    expect((await collab.api.get(`/boards/${boardId}`)).status).toBe(404);
    expect((await collab.api.get("/boards")).body.items).toEqual([]);
    const board = await loadBoard(admin, boardId);
    const byTitle = Object.fromEntries(board.lists[0].cards.map((c: { title: string; assigneeIds: string[] }) => [c.title, c.assigneeIds]));
    expect(byTitle.C1).toEqual([]);
    expect(byTitle.C2).toEqual([admin.id]); // B39: remaining assignee kept
    const comments = (await admin.api.get(`/cards/${c3}/comments`)).body.items;
    expect(comments).toHaveLength(1);
    expect(comments[0].author.name).toBe("Bia");
  });

  it("CA-M9 — atribuir responsáveis: vários por card, aparecem no quadro e no card", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "C");
    expect((await collab.api.put(`/cards/${card}/assignees/${collab.id}`)).status).toBe(204);
    expect((await collab.api.put(`/cards/${card}/assignees/${admin.id}`)).status).toBe(204);

    const board = await loadBoard(admin, boardId);
    expect(board.lists[0].cards[0].assigneeIds.sort()).toEqual([admin.id, collab.id].sort());
    const detail = (await admin.api.get(`/cards/${card}`)).body;
    expect(detail.assigneeIds.sort()).toEqual([admin.id, collab.id].sort());
  });

  it("CA-M10 — atribuir quem não é membro é recusado", async () => {
    const { admin, boardId } = await boardWithTeam();
    const outsider = await registerUser("Fora");
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "C");
    const res = await admin.api.put(`/cards/${card}/assignees/${outsider.id}`);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("USER_NOT_MEMBER");
  });

  it("CA-M11 — atribuir de novo não duplica", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "C");
    await admin.api.put(`/cards/${card}/assignees/${collab.id}`);
    expect((await admin.api.put(`/cards/${card}/assignees/${collab.id}`)).status).toBe(204);
    expect(await count("card_assignees", "card_id = $1", [card])).toBe(1);
  });

  it("CA-M12 — remover a atribuição mantém a pessoa no quadro", async () => {
    const { admin, collab, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "C");
    await admin.api.put(`/cards/${card}/assignees/${collab.id}`);
    expect((await admin.api.del(`/cards/${card}/assignees/${collab.id}`)).status).toBe(204);
    expect((await loadBoard(admin, boardId)).lists[0].cards[0].assigneeIds).toEqual([]);
    expect((await collab.api.get(`/boards/${boardId}`)).status).toBe(200);
  });

  it("RN-R3 — um Observador pode ser responsável por um card (informativo), mas não o edita", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "C");
    expect((await admin.api.put(`/cards/${card}/assignees/${observer.id}`)).status).toBe(204);
    expect((await observer.api.patch(`/cards/${card}`, { title: "x" })).status).toBe(403);
  });

  it("Observador não atribui responsáveis (403)", async () => {
    const { admin, observer, boardId } = await boardWithTeam();
    const list = await createList(admin, boardId, "L");
    const card = await createCard(admin, list, "C");
    expect((await observer.api.put(`/cards/${card}/assignees/${admin.id}`)).status).toBe(403);
  });
});
