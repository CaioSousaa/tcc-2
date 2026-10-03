"use client";

import { LogOut, UserMinus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, FormError, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { Member, Role } from "@/lib/types";

export function MembersModal({
  boardId,
  members,
  currentUserId,
  isAdmin,
  onClose,
  onChanged,
  onLeft,
}: {
  boardId: string;
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => void;
  onLeft: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>, after: () => void = onChanged) {
    setError(null);
    try {
      await fn();
      after();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Membros" onClose={onClose}>
      <div className="space-y-4 p-5">
        <ul className="space-y-2">
          {members.map((m) => {
            const isSelf = m.userId === currentUserId;
            return (
              <li key={m.userId} className="flex items-center gap-3">
                <Avatar name={m.name} seed={m.userId} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {m.name}
                    {isSelf && <span className="font-normal text-muted"> (você)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                {isAdmin ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      run(() =>
                        api.patch(`/boards/${boardId}/members/${m.userId}`, {
                          role: e.target.value,
                        }),
                      )
                    }
                    className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-ink"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="MEMBER">Membro</option>
                  </select>
                ) : (
                  <span className="rounded bg-surface-alt px-1.5 py-0.5 text-[10px] font-bold text-muted">
                    {m.role === "ADMIN" ? "ADMIN" : "MEMBRO"}
                  </span>
                )}
                {isAdmin && !isSelf && (
                  <IconButton
                    aria-label="Remover membro"
                    onClick={() => run(() => api.delete(`/boards/${boardId}/members/${m.userId}`))}
                  >
                    <UserMinus size={15} />
                  </IconButton>
                )}
                {isSelf && (
                  <IconButton
                    aria-label="Sair do quadro"
                    title="Sair do quadro"
                    onClick={() =>
                      run(() => api.delete(`/boards/${boardId}/members/${m.userId}`), onLeft)
                    }
                  >
                    <LogOut size={15} />
                  </IconButton>
                )}
              </li>
            );
          })}
        </ul>

        {isAdmin ? (
          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api.post(`/boards/${boardId}/members`, { email, role });
                setEmail("");
              });
            }}
          >
            <p className="text-sm font-medium text-ink">Convidar membro</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Field
                  type="email"
                  placeholder="e-mail da pessoa cadastrada"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-36">
                <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Administrador</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!email.trim()}>
                Convidar
              </Button>
            </div>
          </form>
        ) : (
          <p className="border-t border-border pt-3 text-xs text-muted">
            Apenas administradores convidam e gerenciam membros.
          </p>
        )}
        <FormError message={error} />
      </div>
    </Modal>
  );
}
