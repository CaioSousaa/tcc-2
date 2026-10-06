import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { AppDataSource } from "../../database";
import { RefreshToken } from "../../entities/RefreshToken";
import { User } from "../../entities/User";
import { AppError } from "../../utils/AppError";
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from "../../utils/tokens";

const users = () => AppDataSource.getRepository(User);
const refreshTokens = () => AppDataSource.getRepository(RefreshToken);

export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

async function issueTokens(user: User, remember: boolean) {
  const ttlDays = remember ? env.refreshTtlDays : 1;
  const refreshToken = generateRefreshToken();
  await refreshTokens().save(
    refreshTokens().create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      revokedAt: null,
    }),
  );
  return {
    user: publicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken,
  };
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  const email = data.email.toLowerCase();
  if (await users().findOne({ where: { email } })) {
    throw new AppError(409, "E-mail já cadastrado");
  }
  const user = await users().save(
    users().create({
      name: data.name.trim(),
      email,
      passwordHash: await bcrypt.hash(data.password, 10),
    }),
  );
  return issueTokens(user, true);
}

export async function login(data: {
  email: string;
  password: string;
  remember: boolean;
}) {
  const user = await users().findOne({
    where: { email: data.email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new AppError(401, "E-mail ou senha inválidos");
  }
  return issueTokens(user, data.remember);
}

export async function refresh(token: string) {
  const stored = await refreshTokens().findOne({
    where: { tokenHash: hashToken(token) },
    relations: { user: true },
  });
  if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
    throw new AppError(401, "Sessão expirada");
  }
  stored.revokedAt = new Date();
  await refreshTokens().save(stored);

  const remainingMs = stored.expiresAt.getTime() - Date.now();
  const remember = remainingMs > 24 * 60 * 60 * 1000;
  return issueTokens(stored.user, remember);
}

export async function logout(token: string) {
  const stored = await refreshTokens().findOne({
    where: { tokenHash: hashToken(token) },
  });
  if (stored && !stored.revokedAt) {
    stored.revokedAt = new Date();
    await refreshTokens().save(stored);
  }
}

export async function me(userId: string) {
  const user = await users().findOne({ where: { id: userId } });
  if (!user) throw new AppError(401, "Usuário não encontrado");
  return publicUser(user);
}
