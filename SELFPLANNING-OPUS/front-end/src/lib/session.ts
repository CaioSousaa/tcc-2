import type { User } from "./types";

const KEY = "kanbo.session";

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  /** true = localStorage (sobrevive ao fechar o navegador); false = sessionStorage */
  remember: boolean;
}

function storages(): Storage[] {
  if (typeof window === "undefined") return [];
  return [window.localStorage, window.sessionStorage];
}

export function loadSession(): Session | null {
  for (const storage of storages()) {
    try {
      const raw = storage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      // armazenamento indisponível ou corrompido: tenta o próximo
    }
  }
  return null;
}

export function saveSession(session: Session): void {
  clearSession();
  const [local, perTab] = storages();
  const target = session.remember ? local : perTab;
  try {
    target?.setItem(KEY, JSON.stringify(session));
  } catch {
    // sem armazenamento a sessão só vale enquanto a página estiver aberta
  }
}

export function updateSession(patch: Partial<Session>): Session | null {
  const current = loadSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveSession(next);
  return next;
}

export function clearSession(): void {
  for (const storage of storages()) {
    try {
      storage.removeItem(KEY);
    } catch {
      // ignorado
    }
  }
}
