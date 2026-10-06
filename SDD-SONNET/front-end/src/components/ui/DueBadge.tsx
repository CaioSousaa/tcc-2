import { Clock3 } from "lucide-react";
import { dueText, dueTone, type DueTone } from "@/lib/date";

const STYLES: Record<Exclude<DueTone, "none">, string> = {
  overdue: "bg-red-bg text-red",
  soon: "bg-amber-bg text-amber-text",
  done: "bg-green-bg text-green",
  ok: "bg-chip-neutral text-muted",
};

/** Prazo do card, como no protótipo: relógio + texto; atrasado em vermelho (RF-36). */
export function DueBadge({
  card,
  today,
  wide = false,
}: {
  card: { dueDate: string | null; completed: boolean };
  today: string;
  /** Ocupa a largura toda (barra lateral do card). */
  wide?: boolean;
}) {
  const tone = dueTone(card, today);
  if (tone === "none") return null;
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-md text-[13px] font-medium ${
        wide ? "h-[30px] w-full px-3" : "px-2.5 py-[5px]"
      } ${STYLES[tone]}`}
    >
      <Clock3 size={13} aria-hidden />
      {dueText(card, today)}
    </span>
  );
}
