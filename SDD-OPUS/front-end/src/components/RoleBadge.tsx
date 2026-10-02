import { ROLE_LABELS, type Role } from "@/lib/types";

const TONES: Record<Role, string> = {
  admin: "bg-indigo-100 text-indigo-700",
  collaborator: "bg-emerald-100 text-emerald-700",
  observer: "bg-slate-200 text-slate-700",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
