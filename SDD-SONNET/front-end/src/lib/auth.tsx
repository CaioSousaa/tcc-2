"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return value;
}

/**
 * Carrega o usuário da sessão. Se a API responder 401, o interceptor do axios
 * leva ao login com o destino atual (RF-05, CB-05).
 */
export function AuthProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ user: User }>("/auth/me")
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo(() => (user ? { user, logout } : null), [user, logout]);

  if (!value) return <>{fallback}</>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
