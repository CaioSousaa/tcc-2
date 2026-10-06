"use client";

import { LogOut, Trash2 } from "lucide-react";
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
    <Modal
      title="Membros do quadro"
      subtitle="Administradores gerenciam listas, etiquetas e membros. Membros editam cards."
      width={572}
      onClose={onClose}
    >
      {isAdmin && (
        <form
          className="flex items-center gap-[9px]"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api.post(`/boards/${boardId}/members`, { email, role });
              setEmail("");
            });
          }}
        >
          <Field
            type="email"
            wrapperClassName="min-w-0 flex-1"
            className="h-[46px] text-[15.5px]"
            placeholder="e-mail do convidado"
            aria-label="E-mail do convidado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            wrapperClassName="w-[147px] shrink-0"
            className="h-[46px]"
            aria-label="Papel do convidado"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="MEMBER">Membro</option>
            <option value="ADMIN">Administrador</option>
          </Select>
          <Button type="submit" className="h-[46px] shrink-0" disabled={!email.trim()}>
            Convidar
          </Button>
        </form>
      )}

      <ul className="flex flex-col">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          return (
            <li
              key={m.userId}
              className="flex items-center gap-3.5 border-b border-border px-1 py-[13px] last:border-b-0"
            >
              <Avatar name={m.name} seed={m.userId} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15.5px] font-medium text-ink">{m.name}</span>
                <span className="truncate text-[13.5px] text-muted">{m.email}</span>
              </div>
              <span className="text-[13.5px] text-muted">{isSelf ? "você" : "ativo"}</span>
              {isAdmin ? (
                <Select
                  wrapperClassName="w-[136px] shrink-0"
                  className="h-[38px] text-sm"
                  aria-label={`Papel de ${m.name}`}
                  value={m.role}
                  onChange={(e) =>
                    run(() =>
                      api.patch(`/boards/${boardId}/members/${m.userId}`, {
                        role: e.target.value,
                      }),
                    )
                  }
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="MEMBER">Membro</option>
                </Select>
              ) : (
                <span className="w-[136px] shrink-0 text-sm text-ink">
                  {m.role === "ADMIN" ? "Administrador" : "Membro"}
                </span>
              )}
              {isSelf ? (
                <IconButton
                  aria-label="Sair do quadro"
                  title="Sair do quadro"
                  onClick={() =>
                    run(() => api.delete(`/boards/${boardId}/members/${m.userId}`), onLeft)
                  }
                >
                  <LogOut size={13} />
                </IconButton>
              ) : isAdmin ? (
                <IconButton
                  aria-label="Remover membro"
                  title="Remover membro"
                  className="text-red"
                  onClick={() => run(() => api.delete(`/boards/${boardId}/members/${m.userId}`))}
                >
                  <Trash2 size={13} />
                </IconButton>
              ) : (
                <span className="w-[30px] shrink-0" />
              )}
            </li>
          );
        })}
      </ul>

      {!isAdmin && (
        <p className="text-[13.5px] text-muted">
          Apenas administradores convidam e gerenciam membros.
        </p>
      )}
      <FormError message={error} />
    </Modal>
  );
}
