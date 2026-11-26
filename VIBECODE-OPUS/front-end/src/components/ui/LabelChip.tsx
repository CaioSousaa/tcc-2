import { LABEL_STYLE } from "@/lib/colors";
import type { Label } from "@/lib/types";

export function LabelChip({ label, className = "" }: { label: Label; className?: string }) {
  const style = LABEL_STYLE[label.color] ?? LABEL_STYLE.slate;
  return (
    <span
      className={`inline-flex items-center rounded-md px-[9px] py-[3px] text-[12.5px] font-medium ${className}`}
      style={{ background: style.bg, color: style.text }}
    >
      {label.name || "Sem nome"}
    </span>
  );
}
