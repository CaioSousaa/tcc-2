import { avatarColor, initials } from "@/lib/colors";
import type { User } from "@/lib/types";

interface AvatarProps {
  user: Pick<User, "id" | "name">;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({ user, size = 32, ring, className = "" }: AvatarProps) {
  return (
    <span
      title={user.name}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${
        ring ? "ring-2 ring-surface" : ""
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(user.id),
        fontSize: Math.max(9.5, Math.round(size * 0.36)),
      }}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({
  users,
  size = 26,
  max = 4,
}: {
  users: Pick<User, "id" | "name">[];
  size?: number;
  max?: number;
}) {
  const visible = users.slice(0, max);
  const rest = users.length - visible.length;
  return (
    <div className="flex items-center">
      {visible.map((user, index) => (
        <Avatar
          key={user.id}
          user={user}
          size={size}
          ring
          className={index > 0 ? "-ml-1.5" : ""}
        />
      ))}
      {rest > 0 && (
        <span
          className="-ml-1.5 inline-flex items-center justify-center rounded-full bg-track text-[10px] font-semibold text-body ring-2 ring-surface"
          style={{ width: size, height: size }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
