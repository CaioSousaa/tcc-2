import { describe, expect, it } from "vitest";

// Through the real Next.js server (proxy guard + /api rewrite + first-party cookie).
// Needs the back-end on :3333 and `next start` on :3000, so it only runs when E2E_WEB_URL is set:
//   E2E_WEB_URL=http://localhost:3000 npm run test:integration -- e2e-web
const WEB = process.env.E2E_WEB_URL;

describe.skipIf(!WEB)("Fluxo ponta a ponta pelo Next (CA-C9, proxy, rewrite, cookie)", () => {
  const email = `e2e${Date.now()}@ex.com`;
  let cookie = "";

  const web = (path: string, init: RequestInit = {}) =>
    fetch(`${WEB}${path}`, { redirect: "manual", ...init, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(init.headers as Record<string, string>) } });

  it("CA-C9 — sem sessão, rota protegida redireciona ao login guardando o destino", async () => {
    const res = await web("/boards/abc?card=1");
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!, WEB);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/boards/abc?card=1");
  });

  it("as páginas públicas respondem 200", async () => {
    expect((await web("/login")).status).toBe(200);
    expect((await web("/register")).status).toBe(200);
  });

  it("cadastro pelo Next (rewrite /api): 201 e cookie de sessão de primeira parte", async () => {
    const res = await web("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: WEB! },
      body: JSON.stringify({ name: "E2E", email, password: "12345678" }),
    });
    expect(res.status).toBe(201);
    const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("sid="))!;
    expect(setCookie).toMatch(/HttpOnly/i);
    cookie = setCookie.split(";")[0];
  });

  it("com sessão, /boards abre; /login e /register voltam para /boards", async () => {
    expect((await web("/boards")).status).toBe(200);
    for (const path of ["/login", "/register"]) {
      const res = await web(path);
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!, WEB).pathname).toBe("/boards");
    }
  });

  it("?next= malicioso no login não vira redirecionamento externo", async () => {
    const res = await web("/login?next=https://evil.test");
    expect(res.status).toBe(307);
    const target = new URL(res.headers.get("location")!, WEB);
    expect(target.host).toBe(new URL(WEB!).host);
    expect(target.pathname).toBe("/boards");
  });

  it("a API autenticada responde pelo Next e a origem do Next passa na checagem de CSRF", async () => {
    const created = await web("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: WEB! },
      body: JSON.stringify({ name: "Quadro E2E" }),
    });
    expect(created.status).toBe(201);
    const id = (await created.json()).id as string;
    expect((await web(`/api/boards/${id}`)).status).toBe(200);
    expect((await web(`/boards/${id}`)).status).toBe(200); // the board page itself
  });

  it("mutação com Origin de terceiros pelo Next continua sendo recusada (403)", async () => {
    const res = await web("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://evil.test" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(403);
  });

  it("CA-C8 — logout pelo Next limpa o cookie; depois disso /boards volta a redirecionar", async () => {
    const res = await web("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json", Origin: WEB! }, body: "{}" });
    expect(res.status).toBe(204);
    const cleared = res.headers.getSetCookie().find((c) => c.startsWith("sid="))!;
    expect(cleared).toMatch(/^sid=;/);
    cookie = "";
    const after = await web("/boards");
    expect(after.status).toBe(307);
    expect(new URL(after.headers.get("location")!, WEB).pathname).toBe("/login");
  });

  it("um cookie inválido passa pelo proxy (só checa presença), mas a API devolve 401 e limpa o cookie", async () => {
    cookie = "sid=cookie-invalido";
    expect((await web("/boards")).status).toBe(200); // optimistic guard (plan §2.5)
    const api = await web("/api/auth/me");
    expect(api.status).toBe(401);
    expect(api.headers.getSetCookie().find((c) => c.startsWith("sid="))).toMatch(/^sid=;/);
  });
});
