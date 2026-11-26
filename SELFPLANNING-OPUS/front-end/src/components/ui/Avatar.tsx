import { avatarColor, initials } from "@/lib/format";
import type { User } from "@/lib/types";

interface AvatarProps {
  user: Pick<User, "id" | "name">;
  size?: number;
  ring?: boolean;
  title?: string;
}

export function Avatar({ user, size = 28, ring = false, title }: AvatarProps) {
  return (
    <span
      title={title ?? user.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
        ring ? "ring-[1.5px] ring-white" : ""
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(user.id),
        fontSize: Math.max(10, Math.round(size * 0.38)),
      }}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({ users, size = 26, max = 5 }: { users: User[]; size?: number; max?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((user) => (
        <Avatar key={user.id} user={user} size={size} ring />
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-border text-[10px] font-semibold text-body ring-[1.5px] ring-white"
          style={{ width: size, height: size }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
