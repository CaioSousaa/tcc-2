import { Avatar } from "@/components/Avatar";
import { dueStatus, formatDueDate, type DueStatus } from "@/lib/dates";
import { labelStyle } from "@/lib/palette";
import { progressPercent, progressText } from "@/lib/progress";
import type { CardSummary, Label, Member } from "@/lib/types";

const DUE_STYLES: Record<Exclude<DueStatus, "none">, string> = {
  overdue: "bg-red-100 text-red-800",
  today: "bg-amber-100 text-amber-800",
  upcoming: "bg-slate-100 text-slate-700",
  done: "bg-emerald-100 text-emerald-800",
};

/** P3: overdue is never signalled by color alone — it also carries an icon and the word. */
export function DueBadge({
  dueDate,
  completed,
  today,
}: {
  dueDate: string;
  completed: boolean;
  today: string;
}) {
  const status = dueStatus({ dueDate, completed }, today);
  if (status === "none") return null;
  const text = formatDueDate(dueDate);
  const content =
    status === "overdue"
      ? `⚠ Atrasado · ${text}`
      : status === "today"
        ? `Vence hoje · ${text}`
        : status === "done"
          ? `✓ ${text}`
          : `Prazo ${text}`;
  return (
    <span
      data-testid="due-badge"
      data-status={status}
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${DUE_STYLES[status]}`}
    >
      {content}
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

  return (
    <div className="rounded-lg bg-white p-2.5 text-left shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300">
      {labels.length > 0 && (
        <ul className="mb-1.5 flex flex-wrap gap-1" aria-label="Etiquetas">
          {labels.map((label) => (
            <li
              key={label.id}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${labelStyle(label.color).chip}`}
            >
              {label.name}
            </li>
          ))}
        </ul>
      )}

      <p
        className={`break-words text-sm font-medium ${card.completed ? "text-slate-400 line-through" : "text-slate-900"}`}
      >
        {card.title}
      </p>

      {(card.dueDate || card.checklistTotal > 0 || assignees.length > 0 || card.completed) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {card.dueDate && <DueBadge dueDate={card.dueDate} completed={card.completed} today={today} />}
          {card.completed && !card.dueDate && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
              ✓ Concluído
            </span>
          )}
          {card.checklistTotal > 0 && (
            <span
              data-testid="card-progress"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600"
              title={`${percent}% concluído`}
            >
              <span aria-hidden="true">☑</span>
              {progressText(card.checklistChecked, card.checklistTotal)}
              <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <span className="block h-full bg-emerald-500" style={{ width: `${percent ?? 0}%` }} />
              </span>
            </span>
          )}
          {assignees.length > 0 && (
            <span className="ml-auto flex -space-x-1.5" aria-label="Responsáveis">
              {assignees.map((member) => (
                <Avatar key={member.userId} name={member.name} />
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
