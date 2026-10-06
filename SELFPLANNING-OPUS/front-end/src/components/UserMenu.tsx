"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu({ showName = true }: { showName?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full pr-1 hover:opacity-90"
      >
        <Avatar user={user} size={38} />
        {showName && <span className="text-base text-ink">{user.name}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-60 rounded-xl border border-border bg-white p-2 shadow-lg">
          <div className="border-b border-border px-3 pb-2.5 pt-1.5">
            <p className="truncate text-[15px] font-medium text-ink">{user.name}</p>
            <p className="truncate text-[13px] text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[15px] text-body hover:bg-surface-alt"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
