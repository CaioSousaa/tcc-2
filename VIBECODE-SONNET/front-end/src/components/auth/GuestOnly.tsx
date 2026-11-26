"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";

/** Redireciona usuários já autenticados (sessão persistida) para os quadros. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/boards");
  }, [loading, user, router]);

  if (loading || user) return <FullPageSpinner />;
  return <>{children}</>;
}
