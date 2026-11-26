import { initials } from "@/lib/initials";
import { avatarClass } from "@/lib/palette";

export function Avatar({
  name,
  id,
  size = 28,
  ring = false,
}: {
  name: string;
  /** Identificador da pessoa: define a cor do avatar de forma estável. */
  id?: string;
  size?: number;
  /** Contorno branco, usado quando os avatares se sobrepõem. */
  ring?: boolean;
}) {
  return (
    <span
      title={name}
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${avatarClass(
        id ?? name,
      )} ${ring ? "ring-[1.5px] ring-surface" : ""}`}
    >
      {initials(name)}
    </span>
  );
}

/** Avatares sobrepostos (gap negativo do protótipo); mostra `+N` além de `max`. */
export function AvatarStack({
  people,
  size = 26,
  max = 4,
}: {
  people: { id: string; name: string }[];
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((person) => (
        <Avatar key={person.id} id={person.id} name={person.name} size={size} ring />
      ))}
      {extra > 0 ? (
        <span
          style={{ width: size, height: size }}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-chip-neutral text-[10px] font-semibold text-muted ring-[1.5px] ring-surface"
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
