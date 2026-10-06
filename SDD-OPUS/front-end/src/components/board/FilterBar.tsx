"use client";

import { ListFilter, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { isFilterActive, toggleLabel, type CardFilter, EMPTY_FILTER } from "@/lib/filters";
import { labelStyle } from "@/lib/palette";
import type { Label } from "@/lib/types";

interface FilterBarProps {
  labels: Label[];
  filter: CardFilter;
  onChange: (filter: CardFilter) => void;
  overdueCount: number;
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex h-[34px] items-center gap-2 rounded-full border px-[15px] text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
        pressed ? "border-ink bg-ink font-medium text-white" : "border-line bg-surface text-body hover:bg-surface-alt"
      }`}
    >
      {children}
    </button>
  );
}

/** Local view filter: labels (union) and "only overdue". Nothing here is sent to the server. */
export function FilterBar({ labels, filter, onChange, overdueCount }: FilterBarProps) {
  const active = isFilterActive(filter);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros do quadro">
      <span className="flex items-center gap-2.5 pr-2.5 text-[15px] text-muted">
        <ListFilter size={14} aria-hidden="true" /> Filtrar por etiqueta
      </span>

      <Chip pressed={filter.labelIds.size === 0} onClick={() => onChange({ ...filter, labelIds: new Set() })}>
        <span aria-hidden="true" className="size-2 rounded-full bg-[#8A93A5]" />
        Todas
      </Chip>

      {labels.length === 0 ? (
        <span className="text-[13.5px] text-muted">Sem etiquetas no quadro</span>
      ) : (
        labels.map((label) => (
          <Chip
            key={label.id}
            pressed={filter.labelIds.has(label.id)}
            onClick={() => onChange(toggleLabel(filter, label.id))}
          >
            <span aria-hidden="true" className={`size-2 rounded-full ${labelStyle(label.color).swatch}`} />
            {label.name}
          </Chip>
        ))
      )}

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />

      <Chip pressed={filter.overdueOnly} onClick={() => onChange({ ...filter, overdueOnly: !filter.overdueOnly })}>
        <TriangleAlert size={13} aria-hidden="true" className={filter.overdueOnly ? "" : "text-danger"} />
        {overdueCount} {overdueCount === 1 ? "atrasado" : "atrasados"}
      </Chip>

      {active && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTER)}
          className="px-2 text-[14.5px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
