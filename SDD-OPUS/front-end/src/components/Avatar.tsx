const COLORS = ["#2F6FB5", "#7B5CBD", "#2A8F6A", "#C98A1A", "#C8423A", "#1D3557"];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Stable color per person, so the same member always looks the same across the app. */
export function avatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

const SIZES = { xs: 25, sm: 26, md: 32, lg: 36, xl: 38 } as const;

export function Avatar({
  name,
  seed,
  size = "sm",
  ring = true,
}: {
  name: string;
  /** Defaults to the name; pass the user id when available. */
  seed?: string;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  const px = SIZES[size];
  return (
    <span
      title={name}
      aria-label={name}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.38), backgroundColor: avatarColor(seed ?? name) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${ring ? "ring-2 ring-white" : ""}`}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people, size = "sm" }: { people: { id: string; name: string }[]; size?: keyof typeof SIZES }) {
  return (
    <span className="flex items-center -space-x-1.5">
      {people.map((person) => (
        <Avatar key={person.id} name={person.name} seed={person.id} size={size} />
      ))}
    </span>
  );
}
