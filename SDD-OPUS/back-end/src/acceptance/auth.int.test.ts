import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Api, createBoard, registerUser, resetDatabase, sql, startServer, stopServer } from "./harness";

// Spec §4.1 — Conta e sessão (CA-C1…CA-C9) against the real API and database.
describe("4.1 Conta e sessão", () => {
  beforeAll(startServer);
  afterAll(stopServer);
  beforeEach(resetDatabase);

  it("CA-C1 — cadastro válido: cria a conta, autentica e mostra a lista de quadros vazia", async () => {
    const api = new Api();
    const res = await api.post("/auth/register", { name: "Ana", email: "ana@ex.com", password: "12345678" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Ana", email: "ana@ex.com" });
    expect(api.cookie).toMatch(/^sid=/);

    const boards = await api.get("/boards");
    expect(boards.status).toBe(200);
    expect(boards.body.items).toEqual([]);
  });

  it("CA-C1 — a senha nunca é devolvida nem guardada em claro (RN-A3)", async () => {
    const api = new Api();
    const res = await api.post("/auth/register", { name: "Ana", email: "ana@ex.com", password: "12345678" });
    expect(JSON.stringify(res.body)).not.toMatch(/password|12345678/i);
    const me = await api.get("/auth/me");
    expect(JSON.stringify(me.body)).not.toMatch(/password|hash/i);

    const [row] = await sql<{ password_hash: string }>("SELECT password_hash FROM users");
    expect(row.password_hash).not.toContain("12345678");
    expect(row.password_hash.startsWith("scrypt$")).toBe(true);
  });

  it("CA-C2 — e-mail duplicado (sem distinção de caixa) é recusado e nenhuma conta nova é criada", async () => {
    await new Api().post("/auth/register", { name: "Ana", email: "ana@ex.com", password: "12345678" });
    const res = await new Api().post("/auth/register", { name: "Outra", email: "ANA@ex.com", password: "12345678" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_IN_USE");
    const [{ count }] = await sql<{ count: string }>("SELECT COUNT(*) FROM users");
    expect(Number(count)).toBe(1);
  });

  it("CA-C3 — dados inválidos são recusados, indicando o campo, sem criar conta", async () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ name: "", email: "a@ex.com", password: "12345678" }, "name"],
      [{ name: "Ana", email: "sem-arroba", password: "12345678" }, "email"],
      [{ name: "Ana", email: "a@ex.com", password: "1234567" }, "password"],
    ];
    for (const [payload, field] of cases) {
      const res = await new Api().post("/auth/register", payload);
      expect(res.status, field).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.fields).toHaveProperty(field);
    }
    const [{ count }] = await sql<{ count: string }>("SELECT COUNT(*) FROM users");
    expect(Number(count)).toBe(0);
  });

  it("CA-C4 — login válido autentica e dá acesso aos quadros", async () => {
    const user = await registerUser("Ana");
    await createBoard(user, "Meu quadro");

    const api = new Api();
    const res = await api.post("/auth/login", { email: user.email, password: user.password });
    expect(res.status).toBe(200);
    const boards = await api.get("/boards");
    expect(boards.body.items.map((b: { name: string }) => b.name)).toEqual(["Meu quadro"]);
  });

  it("CA-C5 — senha errada e e-mail inexistente dão a MESMA resposta genérica", async () => {
    const user = await registerUser("Ana");
    const wrongPassword = await new Api().post("/auth/login", { email: user.email, password: "errada-errada" });
    const unknownEmail = await new Api().post("/auth/login", { email: "ninguem@ex.com", password: "qualquer-coisa" });
    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    }
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it("CA-C6 — a sessão persiste: o mesmo cookie, em outro 'navegador', continua autenticado", async () => {
    const user = await registerUser("Ana");
    const reopened = new Api(user.api.cookie);
    const res = await reopened.get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it("CA-C6 — a expiração é deslizante: usar a sessão renova a validade e reemite o cookie", async () => {
    const user = await registerUser("Ana");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sql("UPDATE sessions SET last_used_at = $1, expires_at = $2", [twoHoursAgo, soon]);

    const res = await user.api.get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie().some((c) => c.startsWith("sid="))).toBe(true);

    const [session] = await sql<{ expires_at: Date }>("SELECT expires_at FROM sessions");
    const days = (session.expires_at.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it("CA-C6 — a renovação é gravada no máximo uma vez por hora", async () => {
    const user = await registerUser("Ana");
    const [before] = await sql<{ last_used_at: Date }>("SELECT last_used_at FROM sessions");
    await user.api.get("/auth/me");
    await user.api.get("/auth/me");
    const [after] = await sql<{ last_used_at: Date }>("SELECT last_used_at FROM sessions");
    expect(after.last_used_at.getTime()).toBe(before.last_used_at.getTime());
  });

  it("CA-C7 — sessão inativa além da validade leva ao login (401) e limpa o cookie", async () => {
    const user = await registerUser("Ana");
    await sql("UPDATE sessions SET expires_at = now() - interval '1 minute'");

    const res = await user.api.get("/boards");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
    expect(user.api.cookie).toBeNull();
  });

  it("CA-C8 — logout encerra a sessão de verdade: o cookie antigo deixa de funcionar", async () => {
    const user = await registerUser("Ana");
    const stolen = new Api(user.api.cookie);

    const res = await user.api.post("/auth/logout");
    expect(res.status).toBe(204);
    expect(user.api.cookie).toBeNull();

    expect((await user.api.get("/boards")).status).toBe(401);
    expect((await stolen.get("/boards")).status).toBe(401);
    const [{ count }] = await sql<{ count: string }>("SELECT COUNT(*) FROM sessions");
    expect(Number(count)).toBe(0);
  });

  it("CA-C8 — logout é idempotente e funciona sem sessão válida", async () => {
    expect((await new Api().post("/auth/logout")).status).toBe(204);
  });

  it("CA-C9 / R-18 — toda rota protegida exige sessão", async () => {
    const anon = new Api();
    const user = await registerUser("Ana");
    const boardId = await createBoard(user);
    for (const path of ["/boards", `/boards/${boardId}`, `/boards/${boardId}/members`, "/auth/me"]) {
      const res = await anon.get(path);
      expect(res.status, path).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    }
    expect((await anon.post("/boards", { name: "x" })).status).toBe(401);
  });

  it("B11 — dois cadastros simultâneos com o mesmo e-mail criam apenas uma conta", async () => {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, () =>
        new Api().post("/auth/register", { name: "Ana", email: "corrida@ex.com", password: "12345678" }),
      ),
    );
    expect(attempts.filter((r) => r.status === 201)).toHaveLength(1);
    expect(attempts.filter((r) => r.status === 409)).toHaveLength(5);
    const [{ count }] = await sql<{ count: string }>("SELECT COUNT(*) FROM users WHERE email = 'corrida@ex.com'");
    expect(Number(count)).toBe(1);
  });

  it("R-22 — o limite de taxa das rotas de autenticação responde 429 RATE_LIMITED", async () => {
    const api = new Api();
    let last = 0;
    let code = "";
    for (let i = 0; i < 25; i++) {
      const res = await api.post("/auth/login", { email: "x@ex.com", password: "y" });
      last = res.status;
      code = res.body?.error?.code;
      if (last === 429) break;
    }
    expect(last).toBe(429);
    expect(code).toBe("RATE_LIMITED");
  });

  it("R-22 — mutações vindas de outra origem são recusadas (CSRF); sem Origin passam", async () => {
    const user = await registerUser("Ana");
    const evil = await user.api.call("POST", "/boards", { name: "x" }, { origin: "http://evil.test" });
    expect(evil.status).toBe(403);
    const none = await user.api.call("POST", "/boards", { name: "x" }, { origin: null });
    expect(none.status).toBe(201);
  });

  it("R-15 — JSON malformado é 400 VALIDATION_ERROR, nunca 500", async () => {
    const res = await new Api().call("POST", "/auth/login", undefined, { raw: "{not json" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("R-17 — rota inexistente responde 404 no formato padrão", async () => {
    const user = await registerUser("Ana");
    const res = await user.api.get("/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("R-19 — o cookie de sessão é HttpOnly, SameSite=Lax e dura 30 dias", async () => {
    const res = await new Api().post("/auth/register", { name: "Ana", email: "ana@ex.com", password: "12345678" });
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("sid="))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Max-Age=2592000/);
  });
});
