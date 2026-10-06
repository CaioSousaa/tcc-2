"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearRefreshToken,
  readRefreshToken,
  refreshSession,
  setAccessToken,
  setSessionLostHandler,
  storeRefreshToken,
} from "./api";
import type { AuthResponse, User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionLostHandler(() => setUser(null));
    let cancelled = false;
    (async () => {
      if (readRefreshToken()) {
        try {
          const data = await refreshSession();
          if (!cancelled) setUser(data.user);
        } catch {
          clearRefreshToken();
          setAccessToken(null);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
      setSessionLostHandler(null);
    };
  }, []);

  const applySession = useCallback((data: AuthResponse, persistent: boolean) => {
    setAccessToken(data.accessToken);
    storeRefreshToken(data.refreshToken, persistent);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
        remember,
      });
      applySession(data, remember);
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
      });
      applySession(data, true);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const token = readRefreshToken();
    if (token) {
      try {
        await api.post("/auth/logout", { refreshToken: token });
      } catch {}
    }
    clearRefreshToken();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
