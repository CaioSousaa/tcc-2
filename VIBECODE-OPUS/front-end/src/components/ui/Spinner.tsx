import { LoaderCircle } from "lucide-react";

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-3 py-24 text-muted">
      <LoaderCircle size={20} className="animate-spin" />
      <span className="text-[15px]">{label}</span>
    </div>
  );
}
