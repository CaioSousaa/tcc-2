import { labelTone } from "@/lib/format";
import type { Label } from "@/lib/types";

export function LabelChip({ label, large = false }: { label: Label; large?: boolean }) {
  const tone = labelTone(label);
  return (
    <span
      className={`inline-flex items-center rounded-md px-[9px] font-medium ${
        large ? "py-1 text-[13px]" : "py-[3px] text-[12.5px]"
      }`}
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      {label.name}
    </span>
  );
}
