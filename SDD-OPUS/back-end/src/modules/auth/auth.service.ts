import { LessThan } from "typeorm";
import { AppDataSource } from "../../database";
import { Session } from "../../entities/Session";
import { User } from "../../entities/User";
import { Errors } from "../../shared/errors";
import { isUniqueViolation } from "../../shared/db";
import type { LoginInput, RegisterInput } from "./auth.schemas";
import type { UserDto } from "./auth.types";
import { hashPassword, verifyPassword } from "./password";
import {
  computeExpiry,
  generateSessionToken,
  hashSessionToken,
  isSessionExpired,
  shouldRefreshSession,
} from "./session";

export function toUserDto(user: User): UserDto {
  return { id: user.id, name: user.name, email: user.email };
}

async function createSession(userId: string): Promise<string> {
  const sessions = AppDataSource.getRepository(Session);
  const now = new Date();
  const token = generateSessionToken();

  // Housekeeping: drop this user's expired sessions whenever a new one is opened.
  await sessions.delete({ userId, expiresAt: LessThan(now) });
  await sessions.insert({
    userId,
    tokenHash: hashSessionToken(token),
    lastUsedAt: now,
    expiresAt: computeExpiry(now),
  });

  return token;
}

export async function register(input: RegisterInput): Promise<{ user: UserDto; token: string }> {
  const users = AppDataSource.getRepository(User);

  if (await users.exists({ where: { email: input.email } })) throw Errors.emailInUse();

  const passwordHash = await hashPassword(input.password);
  let user: User;
  try {
    user = await users.save(
      users.create({ name: input.name, email: input.email, passwordHash }),
    );
  } catch (error) {
    // Two simultaneous sign-ups with the same e-mail: only one wins (B11).
    if (isUniqueViolation(error)) throw Errors.emailInUse();
    throw error;
  }

  return { user: toUserDto(user), token: await createSession(user.id) };
}

export async function login(input: LoginInput): Promise<{ user: UserDto; token: string }> {
  const user = await AppDataSource.getRepository(User).findOne({ where: { email: input.email } });

  if (!user) {
    // Spend the same hashing time so response timing does not reveal the account (RN-A5).
    await hashPassword(input.password);
    throw Errors.invalidCredentials();
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw Errors.invalidCredentials();
  }

  return { user: toUserDto(user), token: await createSession(user.id) };
}

export async function logout(token: string): Promise<void> {
  await AppDataSource.getRepository(Session).delete({ tokenHash: hashSessionToken(token) });
}

export interface AuthenticatedSession {
  user: UserDto;
  sessionId: string;
  /** True when the sliding expiry was renewed and the cookie must be re-issued. */
  refreshed: boolean;
}

/** Resolves a session token to its user, or null when unknown/expired. Slides the expiry. */
export async function authenticate(token: string): Promise<AuthenticatedSession | null> {
  const sessions = AppDataSource.getRepository(Session);
  const session = await sessions.findOne({
    where: { tokenHash: hashSessionToken(token) },
    relations: { user: true },
  });
  if (!session) return null;

  const now = new Date();
  if (isSessionExpired(session.expiresAt, now)) {
    await sessions.delete({ id: session.id });
    return null;
  }

  let refreshed = false;
  if (shouldRefreshSession(session.lastUsedAt, now)) {
    await sessions.update({ id: session.id }, { lastUsedAt: now, expiresAt: computeExpiry(now) });
    refreshed = true;
  }

  return { user: toUserDto(session.user), sessionId: session.id, refreshed };
}
