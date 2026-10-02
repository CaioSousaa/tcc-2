import { LABEL_STYLES } from "@/lib/palette";
import type { Label } from "@/lib/types";

/** Etiqueta do protótipo: fundo claro, texto da cor, raio 6, 12.5px/500. */
export function LabelChip({ label, large = false }: { label: Label; large?: boolean }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-md px-[9px] py-[3px] font-medium ${
        large ? "text-[13.5px]" : "text-[12.5px]"
      } ${LABEL_STYLES[label.color].chip}`}
    >
      <span className="truncate">{label.name}</span>
    </span>
  );
}
