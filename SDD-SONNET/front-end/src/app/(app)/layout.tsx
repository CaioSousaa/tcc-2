import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { Spinner } from "@/components/ui/Button";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider
      fallback={
        <div className="flex flex-1 items-center justify-center text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      }
    >
      {children}
    </AuthProvider>
  );
}
