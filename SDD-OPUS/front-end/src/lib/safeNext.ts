export const DEFAULT_LANDING = "/boards";

/**
 * Validates the post-login destination (`?next=`). Only same-site absolute paths are allowed,
 * so the login page can never be used as an open redirect.
 */
export function safeNext(next: string | null | undefined, fallback = DEFAULT_LANDING): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;

  const path = next.split(/[?#]/)[0];
  if (path === "/login" || path === "/register") return fallback;
  return next;
}
