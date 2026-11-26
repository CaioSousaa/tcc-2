"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

/** Só renderiza o conteúdo para usuários autenticados */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") return <LoadingScreen />;
  return <>{children}</>;
}

/** Redireciona quem já está autenticado para fora das telas de login/cadastro */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/boards");
  }, [status, router]);

  if (status !== "unauthenticated") return <LoadingScreen />;
  return <>{children}</>;
}
