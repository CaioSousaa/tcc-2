export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-navy border-t-transparent"
      />
      {label}
    </div>
  );
}
