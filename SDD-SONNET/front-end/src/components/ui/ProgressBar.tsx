import { progressPercent } from "@/lib/progress";
import type { Progress } from "@/lib/types";

/**
 * Trilho de 4px com preenchimento verde e contagem em fonte mono, como no
 * protótipo. Sem itens não há progresso, então não renderiza nada (RN-20).
 */
export function ProgressBar({
  progress,
  thick = false,
  label,
}: {
  progress: Progress;
  thick?: boolean;
  /** Texto à direita; por padrão `feitos/total`. */
  label?: string;
}) {
  const percent = progressPercent(progress);
  if (percent === null) return null;
  return (
    <div
      className="flex w-full items-center gap-3"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progresso: ${progress.done} de ${progress.total}, ${percent}%`}
    >
      <div className={`flex-1 overflow-hidden rounded-full bg-track ${thick ? "h-[5px]" : "h-1"}`}>
        <div
          className="h-full rounded-full bg-green transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-[12.5px] text-muted">
        {label ?? `${progress.done}/${progress.total}`}
      </span>
    </div>
  );
}
