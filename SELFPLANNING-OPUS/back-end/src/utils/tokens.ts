import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../database";
import { RefreshToken } from "../entities/RefreshToken";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERSISTENT_SESSION_DAYS = 30;
const BROWSER_SESSION_DAYS = 1;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado no .env");
  }
  return secret;
}

export function signAccessToken(userId: string): string {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
    "15m") as jwt.SignOptions["expiresIn"];
  return jwt.sign({}, jwtSecret(), { subject: userId, expiresIn });
}

/** Retorna o id do usuário do token ou null se for inválido/expirado. */
export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, jwtSecret());
    return typeof payload === "object" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** Gera um token de renovação opaco e persiste apenas o hash dele. */
export async function issueRefreshToken(
  userId: string,
  persistent: boolean,
): Promise<string> {
  const token = randomBytes(48).toString("hex");
  const days = persistent ? PERSISTENT_SESSION_DAYS : BROWSER_SESSION_DAYS;

  await AppDataSource.getRepository(RefreshToken).save({
    tokenHash: hashToken(token),
    userId,
    persistent,
    expiresAt: new Date(Date.now() + days * DAY_MS),
    revokedAt: null,
  });

  return token;
}
