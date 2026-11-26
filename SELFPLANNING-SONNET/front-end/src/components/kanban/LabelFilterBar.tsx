import { ArrowDownWideNarrow, ListFilter } from "lucide-react";
import type { Label } from "@/lib/types";

function Pill({
  active,
  dot,
  label,
  onClick,
}: {
  active: boolean;
  dot: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-[34px] items-center gap-2 rounded-full border px-[15px] text-[15px] ${
        active
          ? "border-ink bg-ink font-medium text-white"
          : "border-border bg-surface text-body hover:bg-surface-alt"
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </button>
  );
}

export function LabelFilterBar({
  labels,
  selected,
  onToggle,
  onClear,
  total,
  sortByDue,
  onToggleSort,
}: {
  labels: Label[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  total: number;
  sortByDue: boolean;
  onToggleSort: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#FBFBFD] px-[30px] py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2.5 pr-2.5 text-[15px] text-muted">
          <ListFilter size={14} /> Filtrar por etiqueta
        </span>
        <Pill active={selected.length === 0} dot="#8A93A5" label="Todas" onClick={onClear} />
        {labels.map((l) => (
          <Pill
            key={l.id}
            active={selected.includes(l.id)}
            dot={l.color}
            label={l.name}
            onClick={() => onToggle(l.id)}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[14.5px] text-muted">
          {total} {total === 1 ? "card" : "cards"} no quadro
        </span>
        <button
          type="button"
          onClick={onToggleSort}
          aria-pressed={sortByDue}
          className={`inline-flex h-9 items-center gap-[9px] rounded-lg border px-[15px] text-[15px] ${
            sortByDue
              ? "border-ink bg-ink text-white"
              : "border-border bg-surface text-ink hover:bg-surface-alt"
          }`}
        >
          <ArrowDownWideNarrow size={14} /> Ordenar por prazo
        </button>
      </div>
    </div>
  );
}
