import { initials } from "@/lib/dates";

const PALETTE = ["bg-blue", "bg-purple", "bg-green", "bg-amber", "bg-slate", "bg-red"];

function colorFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  seed,
  size = 28,
}: {
  name: string;
  seed?: string;
  size?: number;
}) {
  return (
    <span
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.37 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(seed ?? name)}`}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  size,
  overlap,
  max = 4,
}: {
  people: { id: string; name: string }[];
  size: number;
  overlap: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span
          key={p.id}
          style={{ marginLeft: i === 0 ? 0 : -overlap }}
          className="rounded-full ring-2 ring-surface"
        >
          <Avatar name={p.name} seed={p.id} size={size} />
        </span>
      ))}
    </div>
  );
}
