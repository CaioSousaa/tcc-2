"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useLogout, useMe } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const logout = useLogout();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[110rem] items-center justify-between gap-4 px-4">
          <Link href="/boards" className="text-base font-semibold text-indigo-600">
            Quadros
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {me.data && (
              <span className="hidden truncate text-slate-600 sm:inline" title={me.data.email}>
                {me.data.name}
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => logout.mutate()} loading={logout.isPending}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        {me.isPending ? <Spinner /> : children}
      </div>
    </div>
  );
}
