import { ArrowDownWideNarrow, ListFilter } from "lucide-react";
import { SOLID } from "@/lib/colors";
import type { Label } from "@/lib/types";

const CHIP =
  "inline-flex h-[34px] shrink-0 items-center gap-2 rounded-full border px-[15px] text-[15px] transition";

interface FilterBarProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onClearLabels: () => void;
  onlyOverdue: boolean;
  onToggleOverdue: () => void;
  totalCards: number;
  visibleCards: number;
  overdueCount: number;
  sortByDue: boolean;
  onToggleSort: () => void;
}

export function FilterBar({
  labels,
  selectedLabelIds,
  onToggleLabel,
  onClearLabels,
  onlyOverdue,
  onToggleOverdue,
  totalCards,
  visibleCards,
  overdueCount,
  sortByDue,
  onToggleSort,
}: FilterBarProps) {
  const allSelected = selectedLabelIds.length === 0;
  const filtering = !allSelected || onlyOverdue;

  return (
    <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-3 border-b border-border bg-[#FBFBFD] py-3 pl-[30px] pr-8">
      <div className="scrollbar-thin flex min-w-0 items-center gap-2 overflow-x-auto">
        <span className="flex shrink-0 items-center gap-2.5 pr-2.5 text-[15px] text-muted">
          <ListFilter size={14} /> Filtrar por etiqueta
        </span>
        <button
          type="button"
          aria-pressed={allSelected}
          onClick={onClearLabels}
          className={`${CHIP} ${
            allSelected
              ? "border-ink bg-ink font-medium text-white"
              : "border-border bg-surface text-body hover:border-[#C9CED7]"
          }`}
        >
          <span className="size-2 rounded-full bg-[#8A93A5]" />
          Todas
        </button>
        {labels.map((label) => {
          const selected = selectedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggleLabel(label.id)}
              className={`${CHIP} ${
                selected
                  ? "border-ink bg-ink font-medium text-white"
                  : "border-border bg-surface text-body hover:border-[#C9CED7]"
              }`}
            >
              <span className="size-2 rounded-full" style={{ background: SOLID[label.color] }} />
              {label.name || "Sem nome"}
            </button>
          );
        })}
        <span className="mx-1 h-6 w-px shrink-0 bg-border" />
        <button
          type="button"
          aria-pressed={onlyOverdue}
          onClick={onToggleOverdue}
          className={`${CHIP} ${
            onlyOverdue
              ? "border-red bg-red text-white"
              : "border-border bg-surface text-red hover:border-red/50"
          }`}
        >
          Atrasados
          <span className="font-mono text-[12.5px]">{overdueCount}</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[14.5px] text-muted">
          {filtering
            ? `${visibleCards} de ${totalCards} cards`
            : `${totalCards} ${totalCards === 1 ? "card" : "cards"} no quadro`}
        </span>
        <button
          type="button"
          aria-pressed={sortByDue}
          onClick={onToggleSort}
          className={`inline-flex h-9 items-center gap-[9px] rounded-lg border px-[15px] text-[15px] transition ${
            sortByDue
              ? "border-navy bg-navy text-white"
              : "border-border bg-surface text-ink hover:bg-surface-alt"
          }`}
        >
          <ArrowDownWideNarrow size={14} /> Ordenar por prazo
        </button>
      </div>
    </div>
  );
}
