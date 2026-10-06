"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { FieldError, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { api, getErrorMessage } from "@/lib/api";
import type { BoardMember, BoardRole, Invitation } from "@/lib/types";

const ROLE_LABEL: Record<BoardRole, string> = {
  admin: "Administrador",
  member: "Membro",
};

interface MembersModalProps {
  open: boolean;
  boardId: string;
  members: BoardMember[];
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => void;
  onLeft: () => void;
}

function RoleSelect({
  value,
  disabled,
  onChange,
  label,
}: {
  value: BoardRole;
  disabled?: boolean;
  onChange: (role: BoardRole) => void;
  label: string;
}) {
  return (
    <Select
      className="w-[138px] shrink-0"
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onChange(event.target.value as BoardRole)}
    >
      <option value="admin">{ROLE_LABEL.admin}</option>
      <option value="member">{ROLE_LABEL.member}</option>
    </Select>
  );
}

export function MembersModal({
  open,
  boardId,
  members,
  isAdmin,
  onClose,
  onChanged,
  onLeft,
}: MembersModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get<{ invitations: Invitation[] }>(
        `/boards/${boardId}/invitations`,
      );
      setInvitations(data.invitations);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [boardId, isAdmin, toast]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole("member");
    setInviteError(null);
    setConfirmKey(null);
    loadInvitations();
  }, [open, loadInvitations]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setInviteError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setInviteError("Informe um e-mail válido");
      return;
    }
    setInviting(true);
    try {
      await api.post(`/boards/${boardId}/invitations`, { email: email.trim(), role });
      toast.success("Convite enviado. A pessoa verá o convite ao entrar no Kanbo.");
      setEmail("");
      loadInvitations();
    } catch (err) {
      setInviteError(getErrorMessage(err, "Não foi possível convidar"));
    } finally {
      setInviting(false);
    }
  }

  async function run(key: string, action: () => Promise<unknown>, success?: string) {
    setBusyKey(key);
    try {
      await action();
      if (success) toast.success(success);
      setConfirmKey(null);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  const changeMemberRole = (member: BoardMember, next: BoardRole) =>
    run(member.userId, () =>
      api.patch(`/boards/${boardId}/members/${member.userId}`, { role: next }),
    ).then((ok) => {
      if (ok) onChanged();
    });

  const removeMember = async (member: BoardMember) => {
    const leaving = member.userId === user?.id;
    const ok = await run(
      member.userId,
      () => api.delete(`/boards/${boardId}/members/${member.userId}`),
      leaving ? "Você saiu do quadro" : "Membro removido",
    );
    if (!ok) return;
    if (leaving) onLeft();
    else onChanged();
  };

  const changeInvitationRole = (invitation: Invitation, next: BoardRole) =>
    run(invitation.id, () =>
      api.post(`/boards/${boardId}/invitations`, { email: invitation.email, role: next }),
    ).then((ok) => {
      if (ok) loadInvitations();
    });

  const cancelInvitation = (invitation: Invitation) =>
    run(
      invitation.id,
      () => api.delete(`/boards/${boardId}/invitations/${invitation.id}`),
      "Convite cancelado",
    ).then((ok) => {
      if (ok) loadInvitations();
    });

  function renderDeleteControl({
    rowKey,
    label,
    onConfirm,
    icon = <Trash2 size={14} />,
  }: {
    rowKey: string;
    label: string;
    onConfirm: () => void;
    icon?: React.ReactNode;
  }) {
    if (confirmKey === rowKey) {
      return (
        <span className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="danger"
            className="h-8 px-2.5"
            loading={busyKey === rowKey}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
          <Button size="sm" variant="secondary" className="h-8 px-2.5" onClick={() => setConfirmKey(null)}>
            Não
          </Button>
        </span>
      );
    }
    return (
      <IconButton
        label={label}
        size={32}
        className="border-[#F1C9C5] text-red hover:bg-red-bg hover:text-red-dark"
        onClick={() => setConfirmKey(rowKey)}
      >
        {icon}
      </IconButton>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={572}
      title="Membros do quadro"
      description="Administradores gerenciam listas, etiquetas e membros. Membros editam cards."
    >
      {isAdmin && (
        <form onSubmit={invite} noValidate>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Input
              className="h-[46px] flex-1"
              type="email"
              placeholder="e-mail do convidado"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="E-mail do convidado"
            />
            <Select
              className="w-[148px] shrink-0 [&_select]:h-[46px]"
              value={role}
              onChange={(event) => setRole(event.target.value as BoardRole)}
              aria-label="Papel do convidado"
            >
              <option value="member">{ROLE_LABEL.member}</option>
              <option value="admin">{ROLE_LABEL.admin}</option>
            </Select>
            <Button type="submit" className="h-[46px]" loading={inviting}>
              Convidar
            </Button>
          </div>
          <FieldError message={inviteError} />
        </form>
      )}

      <ul className="mt-5 max-h-[420px] divide-y divide-border overflow-y-auto border-t border-border">
        {members.map((member) => {
          const isMe = member.userId === user?.id;
          const canEditRole = isAdmin && !member.isOwner;
          return (
            <li key={member.userId} className="flex items-center gap-3 py-3">
              <Avatar user={member.user} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] text-ink">
                  {member.user.name}
                  {member.isOwner && (
                    <span className="ml-2 font-mono text-[10.5px] uppercase tracking-wider text-placeholder">
                      criador
                    </span>
                  )}
                </p>
                <p className="truncate text-[13.5px] text-muted">{member.user.email}</p>
              </div>
              <span className="hidden text-[14px] text-muted sm:inline">
                {isMe ? "você" : "ativo"}
              </span>
              {canEditRole ? (
                <RoleSelect
                  value={member.role}
                  disabled={busyKey === member.userId}
                  label={`Papel de ${member.user.name}`}
                  onChange={(next) => changeMemberRole(member, next)}
                />
              ) : (
                <span className="w-[138px] shrink-0 px-1 text-[14.5px] text-body">
                  {ROLE_LABEL[member.role]}
                </span>
              )}
              {!member.isOwner && (isAdmin || isMe) ? (
                renderDeleteControl({
                  rowKey: member.userId,
                  label: isMe ? "Sair do quadro" : `Remover ${member.user.name}`,
                  icon: isMe ? <LogOut size={14} /> : undefined,
                  onConfirm: () => removeMember(member),
                })
              ) : (
                <span className="w-8 shrink-0" />
              )}
            </li>
          );
        })}

        {isAdmin &&
          invitations.map((invitation) => (
            <li key={invitation.id} className="flex items-center gap-3 py-3">
              {invitation.user ? (
                <Avatar user={invitation.user} size={36} />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-outline-strong text-[13px] text-muted">
                  @
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] text-ink">
                  {invitation.user?.name ?? invitation.email}
                </p>
                <p className="truncate text-[13.5px] text-muted">
                  {invitation.user ? invitation.email : "ainda sem conta no Kanbo"}
                </p>
              </div>
              <span className="hidden text-[14px] text-amber-text sm:inline">
                convite pendente
              </span>
              <RoleSelect
                value={invitation.role}
                disabled={busyKey === invitation.id}
                label={`Papel do convite para ${invitation.email}`}
                onChange={(next) => changeInvitationRole(invitation, next)}
              />
              {renderDeleteControl({
                rowKey: invitation.id,
                label: "Cancelar convite",
                onConfirm: () => cancelInvitation(invitation),
              })}
            </li>
          ))}
      </ul>
    </Modal>
  );
}
