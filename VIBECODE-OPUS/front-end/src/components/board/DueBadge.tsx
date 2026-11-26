import { CircleCheck, Clock3 } from "lucide-react";
import { describeDue, getDueStatus } from "@/lib/dates";

const STYLES = {
  overdue: "bg-red-bg text-red",
  soon: "bg-amber-bg text-amber-text",
  upcoming: "bg-chip-bg text-muted",
  done: "bg-green-bg text-green",
} as const;

export function DueBadge({
  dueDate,
  completed,
  className = "",
}: {
  dueDate: string | null;
  completed: boolean;
  className?: string;
}) {
  const status = getDueStatus(dueDate, completed);
  if (!dueDate || status === "none") return null;
  const Icon = status === "done" ? CircleCheck : Clock3;
  const title =
    status === "overdue"
      ? "Card atrasado"
      : status === "soon"
        ? "Vence em breve"
        : status === "done"
          ? "Card concluído"
          : "Prazo";

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-[7px] rounded-md px-2.5 py-[5px] text-[13px] font-medium ${STYLES[status]} ${className}`}
    >
      <Icon size={13} />
      {describeDue(dueDate, completed)}
    </span>
  );
}
