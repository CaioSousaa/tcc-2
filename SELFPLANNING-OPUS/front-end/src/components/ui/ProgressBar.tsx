export function ProgressBar({ percent, height = 4 }: { percent: number; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-track" style={{ height }}>
      <div
        className="h-full rounded-full bg-green transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
