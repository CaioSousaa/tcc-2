import Link from "next/link";

export function Logo({ href = "/boards" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-[9px] bg-navy text-lg font-bold text-white">
        K
      </span>
      <span className="text-[19px] font-bold text-ink">Kanbo</span>
    </Link>
  );
}
