import { CircleCheck, Clock3 } from "lucide-react";
import { AvatarStack } from "@/components/Avatar";
import { daysBetween, dueStatus, formatDueDate, formatDueShort, type DueStatus } from "@/lib/dates";
import { labelStyle } from "@/lib/palette";
import { progressPercent, progressText } from "@/lib/progress";
import type { CardSummary, Label, Member } from "@/lib/types";

const DUE_STYLES: Record<Exclude<DueStatus, "none">, string> = {
  overdue: "bg-danger-bg text-danger",
  today: "bg-warning-bg text-warning-text",
  upcoming: "bg-chip text-muted",
  done: "bg-success-bg text-success",
};

function dueText(status: Exclude<DueStatus, "none">, dueDate: string, today: string): string {
  if (status === "overdue") {
    const days = daysBetween(dueDate, today);
    return `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (status === "today") return "Vence hoje";
  if (status === "done") return `Concluído · ${formatDueShort(dueDate)}`;
  return `Vence ${formatDueShort(dueDate)}`;
}

/** P3: overdue is never signalled by color alone — it also carries an icon and the word. */
export function DueBadge({
  dueDate,
  completed,
  today,
  wide = false,
}: {
  dueDate: string;
  completed: boolean;
  today: string;
  wide?: boolean;
}) {
  const status = dueStatus({ dueDate, completed }, today);
  if (status === "none") return null;
  const Icon = status === "done" ? CircleCheck : Clock3;
  return (
    <span
      data-testid="due-badge"
      data-status={status}
      title={formatDueDate(dueDate)}
      className={`inline-flex items-center gap-[7px] rounded-md text-[13px] font-medium ${
        wide ? "h-[30px] w-full px-3" : "px-2.5 py-[5px]"
      } ${DUE_STYLES[status]}`}
    >
      <Icon size={13} aria-hidden="true" />
      {dueText(status, dueDate, today)}
    </span>
  );
}

export function LabelChip({ label, large = false }: { label: Label; large?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-[9px] py-[3px] font-medium ${large ? "text-[13.5px]" : "text-[12.5px]"} ${labelStyle(label.color).chip}`}
    >
      {label.name}
    </span>
  );
}

interface CardViewProps {
  card: CardSummary;
  labelsById: ReadonlyMap<string, Label>;
  membersById: ReadonlyMap<string, Member>;
  today: string;
}

/** What a card looks like inside a list (progress, labels, deadline, responsibles). */
export function CardView({ card, labelsById, membersById, today }: CardViewProps) {
  const percent = progressPercent(card.checklistChecked, card.checklistTotal);
  const labels = card.labelIds.map((id) => labelsById.get(id)).filter((l): l is Label => Boolean(l));
  const assignees = card.assigneeIds
    .map((id) => membersById.get(id))
    .filter((m): m is Member => Boolean(m));
  const hasMeta = card.dueDate !== null || card.completed || assignees.length > 0;

  return (
    <div className="flex flex-col gap-[11px] rounded-[10px] border border-line bg-surface p-[15px] text-left transition-shadow hover:shadow-md">
      {labels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Etiquetas">
          {labels.map((label) => (
            <li key={label.id}>
              <LabelChip label={label} />
            </li>
          ))}
        </ul>
      )}

      <p
        className={`text-[15.5px] leading-[23px] font-medium break-words ${card.completed ? "text-hint line-through" : "text-ink"}`}
      >
        {card.title}
      </p>

      {card.checklistTotal > 0 && (
        <span data-testid="card-progress" className="flex items-center gap-3" title={`${percent}% concluído`}>
          <span className="h-1 flex-1 overflow-hidden rounded-sm bg-track" aria-hidden="true">
            <span className="block h-full rounded-sm bg-success" style={{ width: `${percent ?? 0}%` }} />
          </span>
          <span className="font-mono text-[12.5px] text-muted">
            {progressText(card.checklistChecked, card.checklistTotal)}
          </span>
        </span>
      )}

      {hasMeta && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {card.dueDate && <DueBadge dueDate={card.dueDate} completed={card.completed} today={today} />}
            {card.completed && !card.dueDate && (
              <span className="inline-flex items-center gap-[7px] rounded-md bg-success-bg px-2.5 py-[5px] text-[13px] font-medium text-success">
                <CircleCheck size={13} aria-hidden="true" /> Concluído
              </span>
            )}
          </div>
          {assignees.length > 0 && (
            <span aria-label="Responsáveis">
              <AvatarStack people={assignees.map((m) => ({ id: m.userId, name: m.name }))} size="xs" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
