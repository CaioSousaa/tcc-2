"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, Trash } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { BoardDetail, BoardRole, Invitation } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

const ROLE_LABEL: Record<BoardRole, string> = {
  admin: "Administrador",
  member: "Membro",
};

interface MembersModalProps {
  open: boolean;
  board: BoardDetail;
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
  onLeft: () => void;
}

export function MembersModal({ open, board, currentUserId, onClose, onChanged, onLeft }: MembersModalProps) {
  const isAdmin = board.role === "admin";
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("member");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!isAdmin) {
      setInvitations([]);
      return;
    }
    try {
      const { data } = await api.get<{ invitations: Invitation[] }>(`/boards/${board.id}/invitations`);
      setInvitations(data.invitations);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [board.id, isAdmin]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotice(null);
    loadInvitations();
  }, [open, loadInvitations]);

  async function run(key: string, action: () => Promise<unknown>, after?: () => void) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      after?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function invite(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError("Informe um e-mail válido.");
      return;
    }
    run(
      "invite",
      async () => {
        const { data } = await api.post<{ userExists: boolean }>(`/boards/${board.id}/invitations`, {
          email: value,
          role,
        });
        setEmail("");
        setNotice(
          data.userExists
            ? `Convite enviado para ${value}. Ele aparecerá na tela de quadros do convidado.`
            : `Convite registrado para ${value}. A pessoa verá o convite assim que criar a conta com este e-mail.`,
        );
      },
      loadInvitations,
    );
  }

  function changeRole(userId: string, newRole: BoardRole) {
    run(`role-${userId}`, () => api.patch(`/boards/${board.id}/members/${userId}`, { role: newRole }), onChanged);
  }

  function removeMember(userId: string, name: string) {
    const self = userId === currentUserId;
    const message = self
      ? "Sair deste quadro? Você perderá o acesso até ser convidado novamente."
      : `Remover ${name} do quadro? Ele também deixará de ser responsável pelos cards.`;
    if (!window.confirm(message)) return;
    run(
      `remove-${userId}`,
      () => api.delete(`/boards/${board.id}/members/${userId}`),
      self ? onLeft : onChanged,
    );
  }

  function changeInvitationRole(invitationId: string, newRole: BoardRole) {
    run(`irole-${invitationId}`, () => api.patch(`/invitations/${invitationId}`, { role: newRole }), loadInvitations);
  }

  function cancelInvitation(invitationId: string) {
    run(`cancel-${invitationId}`, () => api.delete(`/invitations/${invitationId}`), loadInvitations);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={600}
      title="Membros do quadro"
      subtitle="Administradores gerenciam listas, etiquetas e membros. Membros editam cards."
    >
      {isAdmin && (
        <form onSubmit={invite} className="flex flex-wrap items-center gap-[9px] sm:flex-nowrap">
          <Input
            className="h-[46px]"
            type="email"
            placeholder="e-mail do convidado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            wrapperClassName="w-[147px] shrink-0"
            className="h-[46px]"
            value={role}
            onChange={(e) => setRole(e.target.value as BoardRole)}
          >
            <option value="member">Membro</option>
            <option value="admin">Administrador</option>
          </Select>
          <Button type="submit" className="h-[46px] shrink-0" loading={busy === "invite"}>
            Convidar
          </Button>
        </form>
      )}

      {notice && <p className="rounded-lg bg-green-bg px-3 py-2 text-sm text-green">{notice}</p>}
      {error && <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>}

      <ul className="flex flex-col">
        {board.members.map((member) => {
          const self = member.id === currentUserId;
          const canManage = isAdmin && !member.isOwner;
          return (
            <li key={member.id} className="flex items-center gap-3.5 border-t border-border px-1 py-[13px]">
              <Avatar user={member} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15.5px] font-medium text-ink">{member.name}</span>
                <span className="truncate text-[13.5px] text-muted">{member.email}</span>
              </div>
              <span className="hidden text-[13.5px] text-muted sm:inline">
                {self ? "você" : member.isOwner ? "criador" : "ativo"}
              </span>
              {canManage ? (
                <Select
                  selectSize="sm"
                  wrapperClassName="w-[136px] shrink-0"
                  value={member.role}
                  disabled={busy === `role-${member.id}`}
                  onChange={(e) => changeRole(member.id, e.target.value as BoardRole)}
                >
                  <option value="admin">Administrador</option>
                  <option value="member">Membro</option>
                </Select>
              ) : (
                <span className="w-[136px] shrink-0 text-right text-sm text-body">
                  {member.isOwner ? "Administrador" : ROLE_LABEL[member.role]}
                </span>
              )}
              {!member.isOwner && (canManage || self) ? (
                <IconButton
                  icon={self ? LogOut : Trash}
                  label={self ? "Sair do quadro" : "Remover membro"}
                  tone="danger"
                  onClick={() => removeMember(member.id, member.name)}
                  disabled={busy === `remove-${member.id}`}
                />
              ) : (
                <span className="w-[30px] shrink-0" />
              )}
            </li>
          );
        })}

        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex items-center gap-3.5 border-t border-border px-1 py-[13px]">
            <Avatar user={{ id: invitation.email, name: invitation.email }} size={36} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15.5px] font-medium text-ink">{invitation.email}</span>
              <span className="truncate text-[13.5px] text-muted">
                convidado por {invitation.invitedBy?.name ?? "—"}
              </span>
            </div>
            <span className="hidden text-[13.5px] text-muted sm:inline">convite pendente</span>
            <Select
              selectSize="sm"
              wrapperClassName="w-[136px] shrink-0"
              value={invitation.role}
              disabled={busy === `irole-${invitation.id}`}
              onChange={(e) => changeInvitationRole(invitation.id, e.target.value as BoardRole)}
            >
              <option value="admin">Administrador</option>
              <option value="member">Membro</option>
            </Select>
            <IconButton
              icon={Trash}
              label="Cancelar convite"
              tone="danger"
              onClick={() => cancelInvitation(invitation.id)}
              disabled={busy === `cancel-${invitation.id}`}
            />
          </li>
        ))}
      </ul>
    </Modal>
  );
}
