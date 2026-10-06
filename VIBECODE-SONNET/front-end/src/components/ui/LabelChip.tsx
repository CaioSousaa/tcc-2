import { labelStyle } from "@/lib/colors";
import type { Label } from "@/lib/types";

export function LabelChip({ label, large }: { label: Label; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${
        large ? "h-6 px-[9px] text-[13.5px]" : "h-[22px] px-[9px] text-[12.5px]"
      }`}
      style={labelStyle(label.color)}
    >
      {label.name || "    "}
    </span>
  );
}
