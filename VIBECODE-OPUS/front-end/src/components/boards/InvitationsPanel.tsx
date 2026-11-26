"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import { SOLID } from "@/lib/colors";
import type { Invitation } from "@/lib/types";

export function InvitationsPanel({
  invitations,
  onChanged,
}: {
  invitations: Invitation[];
  onChanged: (acceptedBoardId?: string) => void;
}) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  async function respond(invitation: Invitation, action: "accept" | "decline") {
    setBusyId(invitation.id);
    try {
      await api.post(`/invitations/${invitation.id}/${action}`);
      toast.success(action === "accept" ? "Convite aceito" : "Convite recusado");
      onChanged(action === "accept" ? invitation.boardId : undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
        <Mail size={16} /> Convites pendentes
      </h2>
      <ul className="mt-4 divide-y divide-border">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-9 w-1.5 rounded-full"
                style={{ background: SOLID[invitation.board?.color ?? "navy"] }}
              />
              <div>
                <p className="text-[15px] text-ink">
                  <strong className="font-semibold">{invitation.board?.title}</strong>
                </p>
                <p className="text-[13.5px] text-muted">
                  {invitation.invitedBy?.name ?? "Alguém"} convidou você como{" "}
                  {invitation.role === "admin" ? "administrador" : "membro"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === invitation.id}
                onClick={() => respond(invitation, "decline")}
              >
                Recusar
              </Button>
              <Button
                size="sm"
                loading={busyId === invitation.id}
                onClick={() => respond(invitation, "accept")}
              >
                Aceitar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
