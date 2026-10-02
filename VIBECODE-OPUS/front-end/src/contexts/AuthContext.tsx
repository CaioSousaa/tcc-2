"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, onUnauthorized, tokenStorage } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  // Restores the persisted session (if any) when the app loads.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setStatus("unauthenticated");
      return;
    }

    let cancelled = false;
    api
      .get<{ user: User }>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
    return () => onUnauthorized(null);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
        remember,
      });
      tokenStorage.set(data.token, remember);
      setUser(data.user);
      setStatus("authenticated");
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
      });
      tokenStorage.set(data.token, true);
      setUser(data.user);
      setStatus("authenticated");
    },
    [],
  );

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
