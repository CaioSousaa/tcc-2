import { ArrowDownUp } from "lucide-react";
import { LabelChip } from "@/components/ui/LabelChip";
import type { Label } from "@/lib/types";

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
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-6 py-2.5">
      <span className="text-xs font-medium text-muted">Filtrar por etiqueta</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onClear}
          className={`h-6 rounded-full px-2.5 text-xs font-medium ${
            selected.length === 0 ? "bg-navy text-white" : "bg-surface-alt text-body hover:bg-border"
          }`}
        >
          Todas
        </button>
        {labels.map((l) => (
          <LabelChip
            key={l.id}
            name={l.name}
            color={l.color}
            active={selected.length === 0 || selected.includes(l.id)}
            onClick={() => onToggle(l.id)}
          />
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted">
          {total} {total === 1 ? "card" : "cards"} no quadro
        </span>
        <button
          type="button"
          onClick={onToggleSort}
          className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
            sortByDue
              ? "border-navy bg-navy text-white"
              : "border-border bg-surface text-body hover:bg-surface-alt"
          }`}
        >
          <ArrowDownUp size={12} /> Ordenar por prazo
        </button>
      </div>
    </div>
  );
}
