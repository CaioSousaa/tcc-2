import { Clock3 } from "lucide-react";
import { dueBadge, DUE_TONE_CLASSES } from "@/lib/format";

interface DueBadgeProps {
  dueDate: string;
  completed: boolean;
  overdue: boolean;
  large?: boolean;
}

export function DueBadge({ dueDate, completed, overdue, large = false }: DueBadgeProps) {
  const { tone, text } = dueBadge(dueDate, completed, overdue);
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-md font-medium ${DUE_TONE_CLASSES[tone]} ${
        large ? "h-[30px] px-3 text-[13px]" : "px-2.5 py-[5px] text-[13px]"
      }`}
    >
      <Clock3 size={13} />
      {completed ? `${text} · concluído` : text}
    </span>
  );
}
