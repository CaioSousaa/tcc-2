export function LoadingScreen({ message = "Carregando…" }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-[15px] text-muted">
      {message}
    </div>
  );
}
