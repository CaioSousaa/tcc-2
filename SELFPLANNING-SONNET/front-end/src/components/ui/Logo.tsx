import { KanbanSquare } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          light ? "bg-white text-navy" : "bg-navy text-white"
        }`}
      >
        <KanbanSquare size={18} />
      </span>
      <span className={`text-lg font-semibold ${light ? "text-white" : "text-navy"}`}>
        Quadro
      </span>
    </div>
  );
}
