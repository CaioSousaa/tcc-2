import { initials } from "@/lib/dates";

const PALETTE = ["bg-blue", "bg-green", "bg-purple", "bg-amber", "bg-slate", "bg-red"];

function colorFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  seed,
  size = 24,
}: {
  name: string;
  seed?: string;
  size?: number;
}) {
  return (
    <span
      title={name}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface ${colorFor(seed ?? name)}`}
    >
      {initials(name)}
    </span>
  );
}
