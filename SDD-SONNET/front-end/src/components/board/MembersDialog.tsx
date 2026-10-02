"use client";

import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { can } from "@/lib/permissions";
import type { Member, Role } from "@/lib/types";
import { validateEmail } from "@/lib/validation";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, ModalBody, ModalHeader } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useBoardContext } from "./BoardContext";

const ROLES: Role[] = ["admin", "member", "viewer"];

interface MembersDialogProps {
  open: boolean;
  onClose: () => void;
  myUserId: string;
  onLeft: () => void;
}

/** Modal "Membros do quadro" do protótipo (572px). */
export function MembersDialog(props: MembersDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      label="Membros do quadro"
      widthClass="w-[572px]"
    >
      <MembersContent {...props} />
    </Dialog>
  );
}

function MembersContent({ onClose, myUserId, onLeft }: MembersDialogProps) {
  const { boardId, data, reload, role: myRole } = useBoardContext();
  const toast = useToast();
  const isAdmin = can(myRole, "members.manage");
  const [leaving, setLeaving] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  async function changeRole(member: Member, role: Role) {
    try {
      await api.patch(`/boards/${boardId}/members/${member.userId}`, { role });
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    }
    await reload();
  }

  async function remove(member: Member) {
    try {
      await api.delete(`/boards/${boardId}/members/${member.userId}`);
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    }
    setRemoving(null);
    await reload();
  }

  async function leave() {
    try {
      await api.delete(`/boards/${boardId}/members/${myUserId}`);
      setLeaving(false);
      onLeft();
    } catch (cause) {
      toast(toApiError(cause).message, "error");
      setLeaving(false);
    }
  }

  return (
    <ModalBody>
      <ModalHeader
        title="Membros do quadro"
        subtitle="Administradores gerenciam o quadro e seus membros. Membros editam listas e cards. Observadores só visualizam."
        onClose={onClose}
      />

      {isAdmin ? <InviteForm boardId={boardId} onInvited={reload} /> : null}

      <ul>
        {data.members.map((member) => {
          const isMe = member.userId === myUserId;
          return (
            <li
              key={member.userId}
              className="flex items-center gap-3.5 border-t border-border px-1 py-[13px]"
            >
              <Avatar id={member.userId} name={member.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15.5px] font-medium text-ink">{member.name}</p>
                {member.email ? (
                  <p className="truncate text-[13.5px] text-muted">{member.email}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-[13.5px] text-muted">{isMe ? "você" : ""}</span>
              {isAdmin ? (
                <Select
                  id={`role-${member.userId}`}
                  aria-label={`Papel de ${member.name}`}
                  compact
                  wrapperClassName="w-[148px] shrink-0"
                  value={member.role}
                  onChange={(event) => changeRole(member, event.target.value as Role)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              ) : (
                <span className="shrink-0 text-[14px] text-body">{ROLE_LABELS[member.role]}</span>
              )}
              {isAdmin && !isMe ? (
                <IconButton
                  icon={Trash2}
                  danger
                  label={`Remover ${member.name}`}
                  onClick={() => setRemoving(member)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border pt-4">
        <Button variant="secondary" small onClick={() => setLeaving(true)}>
          Sair do quadro
        </Button>
      </div>

      <ConfirmDialog
        open={leaving}
        title="Sair do quadro?"
        confirmLabel="Sair"
        onConfirm={leave}
        onClose={() => setLeaving(false)}
      >
        <p>Você perderá o acesso a este quadro e deixará de ser responsável pelos cards dele.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={removing !== null}
        title={`Remover ${removing?.name ?? ""}?`}
        confirmLabel="Remover"
        onConfirm={() => (removing ? remove(removing) : undefined)}
        onClose={() => setRemoving(null)}
      >
        <p>
          A pessoa deixa de ser responsável pelos cards do quadro; os comentários dela permanecem.
        </p>
      </ConfirmDialog>
    </ModalBody>
  );
}

function InviteForm({ boardId, onInvited }: { boardId: string; onInvited: () => Promise<void> }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateEmail(email);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api.post(`/boards/${boardId}/members`, { email, role });
      setEmail("");
      toast("Membro adicionado ao quadro.", "success");
      await onInvited();
    } catch (cause) {
      const apiError = toApiError(cause);
      setError(apiError.fieldMessage("email") ?? apiError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <div className="flex items-start gap-[9px]">
        <div className="min-w-0 flex-1">
          <Field
            id="invite-email"
            type="email"
            aria-label="E-mail do convidado"
            placeholder="e-mail do convidado"
            value={email}
            error={error}
            onChange={(event) => setEmail(event.target.value)}
            className="h-[46px]"
          />
        </div>
        <Select
          id="invite-role"
          aria-label="Papel do convidado"
          wrapperClassName="w-[147px] shrink-0"
          className="h-[46px]"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
        >
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {ROLE_LABELS[item]}
            </option>
          ))}
        </Select>
        <Button type="submit" loading={pending} className="h-[46px] shrink-0">
          Convidar
        </Button>
      </div>
    </form>
  );
}
