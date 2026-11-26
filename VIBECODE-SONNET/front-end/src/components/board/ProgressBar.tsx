export function ProgressBar({
  done,
  total,
  height = 4,
}: {
  done: number;
  total: number;
  height?: number;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-track"
      style={{ height }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-green transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
