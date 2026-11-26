"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, loadUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  return <>{children}</>;
}
