"use client";

import { useState, type FormEvent } from "react";
import { RoleBadge } from "@/components/RoleBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { errorMessage, parseApiError } from "@/lib/api";
import {
  useChangeMemberRole,
  useInviteMember,
  useMembers,
  useRemoveMember,
} from "@/lib/boards";
import { ROLE_LABELS, type Member, type Role } from "@/lib/types";

const ROLE_OPTIONS: Role[] = ["admin", "collaborator", "observer"];

interface MembersDialogProps {
  boardId: string;
  myRole: Role;
  myUserId: string;
  open: boolean;
  onClose: () => void;
}

function RoleSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as Role)}
      className="rounded-md border-0 bg-white py-1.5 pl-2 pr-7 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

export function MembersDialog({ boardId, myRole, myUserId, open, onClose }: MembersDialogProps) {
  const isAdmin = myRole === "admin";
  const members = useMembers(boardId, open);
  const invite = useInviteMember(boardId);
  const changeRole = useChangeMemberRole(boardId);
  const remove = useRemoveMember(boardId);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("collaborator");
  const [toRemove, setToRemove] = useState<Member | null>(null);

  const inviteError = invite.isError ? parseApiError(invite.error) : null;

  function onInvite(event: FormEvent) {
    event.preventDefault();
    invite.mutate({ email, role: inviteRole }, { onSuccess: () => setEmail("") });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Membros do quadro" width="max-w-xl">
        <div className="space-y-5">
          {isAdmin && (
            <form onSubmit={onInvite} noValidate className="space-y-2 rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">Convidar pessoa</p>
              {inviteError && !inviteError.fields.email && !inviteError.fields.role && (
                <Alert>{inviteError.message}</Alert>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <TextField
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={inviteError?.fields.email}
                  className="flex-1"
                  maxLength={254}
                />
                <div className="sm:pt-6">
                  <RoleSelect label="Papel do convidado" value={inviteRole} onChange={setInviteRole} />
                </div>
                <Button type="submit" loading={invite.isPending} className="sm:mt-6">
                  Convidar
                </Button>
              </div>
            </form>
          )}

          {members.isPending && <Spinner />}
          {members.isError && <Alert>{errorMessage(members.error)}</Alert>}
          {(changeRole.isError || remove.isError) && (
            <Alert>{errorMessage(changeRole.error ?? remove.error)}</Alert>
          )}

          {members.data && (
            <ul className="divide-y divide-slate-200">
              {members.data.map((member) => (
                <li key={member.userId} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.name}
                      {member.userId === myUserId && <span className="ml-1 text-slate-500">(você)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                  {isAdmin ? (
                    <>
                      <RoleSelect
                        label={`Papel de ${member.name}`}
                        value={member.role}
                        disabled={changeRole.isPending}
                        onChange={(role) => changeRole.mutate({ userId: member.userId, role })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => setToRemove(member)}>
                        Remover
                      </Button>
                    </>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={toRemove !== null}
        title="Remover membro"
        confirmLabel="Remover"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        onCancel={() => {
          setToRemove(null);
          remove.reset();
        }}
        onConfirm={() => {
          if (toRemove) {
            remove.mutate(toRemove.userId, { onSuccess: () => setToRemove(null) });
          }
        }}
      >
        <p>
          <strong>{toRemove?.name}</strong> perderá o acesso ao quadro e deixará de ser responsável
          pelos cards em que estava atribuído. Os comentários dela continuam no histórico.
        </p>
      </ConfirmDialog>
    </>
  );
}
