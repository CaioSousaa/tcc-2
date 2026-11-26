"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Invitation } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface InvitationsBannerProps {
  invitations: Invitation[];
  onChanged: (acceptedBoardId?: string) => void;
}

export function InvitationsBanner({ invitations, onChanged }: InvitationsBannerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  async function respond(invitation: Invitation, action: "accept" | "decline") {
    setBusyId(invitation.id);
    setError(null);
    try {
      await api.post(`/invitations/${invitation.id}/${action}`);
      onChanged(action === "accept" ? invitation.board?.id : undefined);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Mail className="size-4 text-muted" />
        Convites pendentes
      </h2>
      {error && <p className="text-sm text-red-dark">{error}</p>}
      <ul className="flex flex-col divide-y divide-border">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span
                className="size-3 rounded-sm"
                style={{ backgroundColor: invitation.board?.color ?? "#1D3557" }}
              />
              <p className="text-[15px] text-body">
                <strong className="font-semibold text-ink">{invitation.invitedBy?.name ?? "Alguém"}</strong>{" "}
                convidou você para <strong className="font-semibold text-ink">{invitation.board?.title}</strong>{" "}
                como {invitation.role === "admin" ? "administrador" : "membro"}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
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
