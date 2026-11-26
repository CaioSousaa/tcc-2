"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearSession, loadSession, saveSession, updateSession } from "@/lib/session";
import type { AuthResponse, User } from "@/lib/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Restaura a sessão salva no navegador e confirma com o servidor
  // (o interceptor renova o token de acesso se ele tiver expirado)
  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setStatus("unauthenticated");
      return;
    }

    setUser(session.user);
    setStatus("authenticated");

    api
      .get<User>("/auth/me")
      .then(({ data }) => {
        setUser(data);
        updateSession({ user: data });
      })
      .catch(() => {
        if (!loadSession()) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });
  }, []);

  const startSession = useCallback((data: AuthResponse, remember: boolean) => {
    saveSession({ ...data, remember });
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const { data } = await api.post<AuthResponse>("/auth/login", { email, password, remember });
      startSession(data, remember);
    },
    [startSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", { name, email, password });
      startSession(data, true);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    const session = loadSession();
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
    if (session) {
      await api.post("/auth/logout", { refreshToken: session.refreshToken }).catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
