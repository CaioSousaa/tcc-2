"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={user.name} seed={user.id} size={38} />
      <span className="hidden text-base text-ink sm:inline">{user.name}</span>
      <IconButton
        aria-label="Sair"
        title="Sair"
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <LogOut size={13} />
      </IconButton>
    </div>
  );
}
