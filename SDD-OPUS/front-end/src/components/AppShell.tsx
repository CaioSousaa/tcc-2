"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { useLogout, useMe } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const pathname = usePathname();
  // The board screen has its own header with a way back to the board list.
  const onBoard = pathname.startsWith("/boards/");

  return (
    <div className="flex min-h-screen flex-col">
      {!onBoard && (
        <header className="flex h-[78px] shrink-0 items-center justify-between gap-6 border-b border-line bg-surface px-6 md:px-10">
          <Link href="/boards" aria-label="Kanbo — meus quadros">
            <Logo />
          </Link>
          {me.data && <UserMenu name={me.data.name} email={me.data.email} id={me.data.id} />}
        </header>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{me.isPending ? <Spinner /> : children}</div>
    </div>
  );
}

function UserMenu({ id, name, email }: { id: string; name: string; email: string }) {
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-navy"
      >
        <Avatar name={name} seed={id} size="xl" ring={false} />
        <span className="hidden text-base text-ink sm:inline">{name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute top-12 right-0 z-30 w-56 rounded-lg border border-line bg-surface p-1.5 shadow-lg">
          <p className="truncate px-3 py-2 text-[13.5px] text-muted" title={email}>
            {email}
          </p>
          <button
            role="menuitem"
            type="button"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[15px] text-ink hover:bg-surface-alt disabled:opacity-60"
          >
            <LogOut size={14} aria-hidden="true" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
