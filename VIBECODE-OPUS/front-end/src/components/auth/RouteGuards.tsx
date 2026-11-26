"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

/** Renders children only for signed-in users; others go to the login page. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") return <Spinner />;
  return <>{children}</>;
}

/** Login/register pages: signed-in users are sent straight to their boards. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/boards");
  }, [status, router]);

  if (status !== "unauthenticated") return <Spinner />;
  return <>{children}</>;
}
