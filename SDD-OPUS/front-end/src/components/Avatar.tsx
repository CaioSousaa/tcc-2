export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";
  return (
    <span
      title={name}
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-2 ring-white ${dimension}`}
    >
      {initials(name)}
    </span>
  );
}
