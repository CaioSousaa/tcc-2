import { ROLE_LABELS, type Role } from "@/lib/types";

const TONES: Record<Role, string> = {
  admin: "bg-info-bg text-navy",
  collaborator: "bg-success-bg text-success",
  observer: "bg-chip text-muted",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex shrink-0 rounded-md px-[9px] py-[3px] text-[12.5px] font-medium ${TONES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
