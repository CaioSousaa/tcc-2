import { AppDataSource } from "../../database";
import { env } from "../../config/env";
import { Session } from "../../entities/Session";
import { User } from "../../entities/User";
import { errors } from "../../shared/errors";
import { hashPassword, verifyPassword } from "./password";
import { generateToken, sessionExpiry } from "./session-token";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionGrant {
  user: PublicUser;
  token: string;
  expiresAt: Date;
}

const DUMMY_HASH = hashPassword("senha-ficticia-para-igualar-tempo");

function toPublic(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

function isUniqueViolation(error: unknown): boolean {
  const driver = (error as { driverError?: { code?: string } })?.driverError;
  return driver?.code === "23505";
}

async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const { token, hash } = generateToken();
  const expiresAt = sessionExpiry(new Date(), env.SESSION_TTL_DAYS);
  await AppDataSource.getRepository(Session).insert({ userId, tokenHash: hash, expiresAt });
  return { token, expiresAt };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SessionGrant> {
  const users = AppDataSource.getRepository(User);
  if (await users.exists({ where: { email: input.email } })) throw errors.emailInUse();

  const passwordHash = await hashPassword(input.password);
  let user: User;
  try {
    user = await users.save(
      users.create({ name: input.name, email: input.email, passwordHash }),
    );
  } catch (error) {
    // Corrida entre dois cadastros com o mesmo e-mail (índice único).
    if (isUniqueViolation(error)) throw errors.emailInUse();
    throw error;
  }

  const session = await createSession(user.id);
  return { user: toPublic(user), ...session };
}

export async function login(input: { email: string; password: string }): Promise<SessionGrant> {
  const user = await AppDataSource.getRepository(User).findOne({ where: { email: input.email } });

  // Com e-mail inexistente ainda se executa uma verificação, para igualar o tempo (RN-05).
  const valid = await verifyPassword(input.password, user ? user.passwordHash : await DUMMY_HASH);
  if (!user || !valid) throw errors.invalidCredentials();

  const session = await createSession(user.id);
  return { user: toPublic(user), ...session };
}

export async function logout(sessionId: string): Promise<void> {
  await AppDataSource.getRepository(Session).delete({ id: sessionId });
}

export async function purgeExpiredSessions(): Promise<void> {
  await AppDataSource.query(`DELETE FROM sessions WHERE expires_at <= now()`);
}
