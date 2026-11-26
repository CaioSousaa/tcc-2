import jwt from "jsonwebtoken";
import type { Response } from "express";
import { unauthorized } from "./HttpError";

const DEFAULT_EXPIRES_IN = "30d";
/** Lifetime of a token when the user did not ask to stay signed in. */
const SHORT_EXPIRES_IN = "12h";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não definido no .env");
  }
  return secret;
}

export function signToken(userId: string, remember = true): string {
  const expiresIn = (
    remember ? process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN : SHORT_EXPIRES_IN
  ) as jwt.SignOptions["expiresIn"];
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw unauthorized("Token inválido");
  }
  return payload.sub;
}

export function getUserId(res: Response): string {
  const userId = res.locals.userId;
  if (typeof userId !== "string") {
    throw unauthorized();
  }
  return userId;
}
