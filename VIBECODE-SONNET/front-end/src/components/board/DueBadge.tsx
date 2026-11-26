import { CircleCheck, Clock3 } from "lucide-react";
import { dueLabel, getDueStatus } from "@/lib/dates";

const STYLES = {
  overdue: "bg-red-bg text-red",
  soon: "bg-amber-bg text-amber-text",
  normal: "bg-chip text-muted",
  done: "bg-green-bg text-green",
  none: "",
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
  if (!dueDate) return null;
  const status = getDueStatus(dueDate, completed);
  const Icon = status === "done" ? CircleCheck : Clock3;
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-md px-2.5 py-[5px] text-[13px] font-medium ${STYLES[status]} ${className}`}
    >
      <Icon className="size-[13px]" strokeWidth={2.2} />
      {dueLabel(dueDate, completed)}
    </span>
  );
}
