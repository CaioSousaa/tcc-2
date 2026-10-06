import "reflect-metadata";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../app";
import { env } from "../config/env";
import { AppDataSource } from "../database";

let server: Server | null = null;
let baseUrl = "";

export async function startServer(): Promise<void> {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  await new Promise<void>((resolve) => {
    server = createApp().listen(0, "127.0.0.1", () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
}

export async function stopServer(): Promise<void> {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  server = null;
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}

export async function resetDatabase(): Promise<void> {
  await AppDataSource.query("TRUNCATE TABLE users, boards RESTART IDENTITY CASCADE");
}

export const sql = <T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> =>
  AppDataSource.query(text, params);

export interface Res {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  headers: Headers;
}

let ipCounter = 10;

/** A browser-like HTTP client: keeps the session cookie, sends the web Origin on mutations. */
export class Api {
  cookie: string | null = null;
  /** Every client gets its own fake client IP (via X-Forwarded-For) so rate limits do not collide. */
  readonly ip = `10.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}.1`;

  constructor(cookie: string | null = null) {
    this.cookie = cookie;
  }

  async call(
    method: string,
    path: string,
    body?: unknown,
    options: { origin?: string | null; headers?: Record<string, string>; raw?: string } = {},
  ): Promise<Res> {
    const headers: Record<string, string> = { "X-Forwarded-For": this.ip, ...options.headers };
    if (body !== undefined || options.raw !== undefined) headers["Content-Type"] = "application/json";
    if (this.cookie) headers.Cookie = this.cookie;
    const origin = options.origin === undefined ? env.WEB_ORIGIN : options.origin;
    if (origin && method !== "GET") headers.Origin = origin;

    const response = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers,
      body: options.raw !== undefined ? options.raw : body === undefined ? undefined : JSON.stringify(body),
    });

    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const [name, value] = pair.split("=");
      if (name === "sid") this.cookie = value ? `sid=${value}` : null;
    }

    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  }

  get = (path: string) => this.call("GET", path);
  post = (path: string, body?: unknown) => this.call("POST", path, body ?? {});
  patch = (path: string, body: unknown) => this.call("PATCH", path, body);
  put = (path: string) => this.call("PUT", path);
  del = (path: string) => this.call("DELETE", path);
}

let userCounter = 0;

export interface TestUser {
  api: Api;
  id: string;
  name: string;
  email: string;
  password: string;
}

export async function registerUser(name = "Usuário"): Promise<TestUser> {
  const email = `${name.toLowerCase().replace(/\W+/g, "")}${++userCounter}@ex.com`;
  const password = "senha-segura-123";
  const api = new Api();
  const res = await api.post("/auth/register", { name, email, password });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { api, id: res.body.user.id, name, email, password };
}

export async function createBoard(user: TestUser, name = "Quadro"): Promise<string> {
  const res = await user.api.post("/boards", { name });
  if (res.status !== 201) throw new Error(`createBoard failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

export async function invite(admin: TestUser, boardId: string, who: TestUser, role: string): Promise<void> {
  const res = await admin.api.post(`/boards/${boardId}/members`, { email: who.email, role });
  if (res.status !== 201) throw new Error(`invite failed: ${res.status} ${JSON.stringify(res.body)}`);
}

export async function createList(user: TestUser, boardId: string, name: string): Promise<string> {
  const res = await user.api.post(`/boards/${boardId}/lists`, { name });
  if (res.status !== 201) throw new Error(`createList failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

export async function createCard(user: TestUser, listId: string, title: string): Promise<string> {
  const res = await user.api.post(`/lists/${listId}/cards`, { title });
  if (res.status !== 201) throw new Error(`createCard failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

export async function createLabel(user: TestUser, boardId: string, name: string, color = "red"): Promise<string> {
  const res = await user.api.post(`/boards/${boardId}/labels`, { name, color });
  if (res.status !== 201) throw new Error(`createLabel failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

/** A board with the creator as admin plus a collaborator and an observer. */
export async function boardWithTeam() {
  const admin = await registerUser("Ana");
  const collab = await registerUser("Bia");
  const observer = await registerUser("Caio");
  const boardId = await createBoard(admin, "Sprint 1");
  await invite(admin, boardId, collab, "collaborator");
  await invite(admin, boardId, observer, "observer");
  return { admin, collab, observer, boardId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Board = any;

export async function loadBoard(user: TestUser, boardId: string): Promise<Board> {
  const res = await user.api.get(`/boards/${boardId}`);
  if (res.status !== 200) throw new Error(`loadBoard failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export const listNames = (board: Board): string[] => board.lists.map((l: { name: string }) => l.name);
export const cardTitles = (list: { cards: { title: string }[] }): string[] => list.cards.map((c) => c.title);

/** Counts the SQL statements issued while `fn` runs (used for the "≤ 8 queries" restriction). */
export async function countQueries<T>(fn: () => Promise<T>): Promise<{ result: T; queries: string[] }> {
  const queries: string[] = [];
  const original = AppDataSource.logger;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (AppDataSource as any).logger = {
    logQuery: (query: string) => queries.push(query),
    logQueryError: () => undefined,
    logQuerySlow: () => undefined,
    logSchemaBuild: () => undefined,
    logMigration: () => undefined,
    log: () => undefined,
  };
  try {
    return { result: await fn(), queries };
  } finally {
    (AppDataSource as unknown as { logger: unknown }).logger = original;
  }
}
