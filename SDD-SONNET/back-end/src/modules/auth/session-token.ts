import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Token opaco de 32 bytes em base64url; só o hash vai para o banco (RT-39). */
export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Validade fixa a partir do login, sem renovação deslizante (RN-04). */
export function sessionExpiry(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}
