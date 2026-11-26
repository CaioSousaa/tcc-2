import jwt, { type SignOptions } from "jsonwebtoken";

interface TokenPayload {
  sub: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não definido no .env");
  }
  return secret;
}

export function signToken(userId: string): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"];
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Token inválido");
  }
  return { sub: payload.sub };
}
