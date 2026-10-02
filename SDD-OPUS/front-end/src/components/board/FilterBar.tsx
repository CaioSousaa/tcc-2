"use client";

import { Button } from "@/components/ui/Button";
import { isFilterActive, toggleLabel, type CardFilter, EMPTY_FILTER } from "@/lib/filters";
import { labelStyle } from "@/lib/palette";
import type { Label } from "@/lib/types";

interface FilterBarProps {
  labels: Label[];
  filter: CardFilter;
  onChange: (filter: CardFilter) => void;
  overdueCount: number;
}

/** Local view filter: labels (union) and "only overdue". Nothing here is sent to the server. */
export function FilterBar({ labels, filter, onChange, overdueCount }: FilterBarProps) {
  const active = isFilterActive(filter);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros do quadro">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Filtrar</span>

      {labels.length === 0 ? (
        <span className="text-xs text-slate-500">Sem etiquetas no quadro</span>
      ) : (
        labels.map((label) => {
          const selected = filter.labelIds.has(label.id);
          return (
            <button
              key={label.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(toggleLabel(filter, label.id))}
              className={`rounded px-2 py-0.5 text-xs font-medium ring-2 ring-inset transition ${labelStyle(label.color).chip} ${selected ? "ring-slate-700" : "ring-transparent opacity-70 hover:opacity-100"}`}
            >
              {selected && "✓ "}
              {label.name}
            </button>
          );
        })
      )}

      <button
        type="button"
        aria-pressed={filter.overdueOnly}
        onClick={() => onChange({ ...filter, overdueOnly: !filter.overdueOnly })}
        className={`rounded px-2 py-0.5 text-xs font-medium ring-2 ring-inset transition ${overdueCount > 0 ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"} ${filter.overdueOnly ? "ring-slate-700" : "ring-transparent"}`}
      >
        ⚠ {overdueCount} {overdueCount === 1 ? "atrasado" : "atrasados"}
      </button>

      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTER)}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
