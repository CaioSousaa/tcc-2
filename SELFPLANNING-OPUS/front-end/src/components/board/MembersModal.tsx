"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { FormError, inputClass, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/format";
import type { BoardRole, Member } from "@/lib/types";

interface MembersModalProps {
  boardId: string;
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
  onChanged: () => void;
  onClose: () => void;
}

const ROLES = Object.entries(ROLE_LABELS) as [BoardRole, string][];

export function MembersModal({ boardId, members, currentUserId, isAdmin, onChanged, onClose }: MembersModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const invite = (event: React.FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api.post(`/boards/${boardId}/members`, { email, role });
      setEmail("");
    });
  };

  const remove = (member: Member) => {
    const message = `Remover ${member.user.name} do quadro? As atribuições dele(a) nos cards também serão removidas.`;
    if (!window.confirm(message)) return;
    run(() => api.delete(`/boards/${boardId}/members/${member.id}`));
  };

  return (
    <Modal
      title="Membros do quadro"
      subtitle="Administradores gerenciam o quadro e os membros. Editores alteram listas, cards e etiquetas. Observadores apenas visualizam."
      width={572}
      onClose={onClose}
    >
      {isAdmin && (
        <form onSubmit={invite} className="flex flex-wrap gap-[9px] sm:flex-nowrap">
          <input
            type="email"
            required
            value={email}
            placeholder="E-mail do usuário"
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} h-[46px] flex-1`}
          />
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as BoardRole)}
            className="h-[46px] sm:w-[147px]"
          >
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={busy} className="h-[46px]">
            Convidar
          </Button>
        </form>
      )}

      <FormError message={error} />

      <ul className="flex flex-col">
        {members.map((member) => {
          const isSelf = member.user.id === currentUserId;
          return (
            <li key={member.id} className="flex items-center gap-3.5 border-b border-border px-1 py-[13px] last:border-b-0">
              <Avatar user={member.user} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15.5px] font-medium text-ink">{member.user.name}</span>
                <span className="truncate text-[13.5px] text-muted">{member.user.email}</span>
              </div>
              {isSelf && <span className="text-[13.5px] text-muted">você</span>}
              {isAdmin ? (
                <Select
                  value={member.role}
                  disabled={busy}
                  onChange={(e) =>
                    run(() => api.patch(`/boards/${boardId}/members/${member.id}`, { role: e.target.value }))
                  }
                  className="h-[38px] w-[136px] px-3 text-sm"
                >
                  {ROLES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              ) : (
                <span className="text-sm text-body">{ROLE_LABELS[member.role]}</span>
              )}
              {isAdmin && (
                <IconButton label="Remover membro" danger disabled={busy} onClick={() => remove(member)}>
                  <X size={13} />
                </IconButton>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
