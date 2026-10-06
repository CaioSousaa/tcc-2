import bcrypt from "bcryptjs";
import { Router } from "express";
import { IsNull } from "typeorm";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { RefreshToken } from "../../entities/RefreshToken";
import { User } from "../../entities/User";
import { AppError } from "../../errors/AppError";
import { ensureAuthenticated } from "../../middlewares/auth";
import {
  hashToken,
  issueRefreshToken,
  signAccessToken,
} from "../../utils/tokens";
import { serializeUser } from "../serializers";

const users = () => AppDataSource.getRepository(User);
const refreshTokens = () => AppDataSource.getRepository(RefreshToken);

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
  password: z.string().min(1, "Informe a senha"),
  remember: z.boolean().default(true),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

async function startSession(user: User, persistent: boolean) {
  return {
    user: serializeUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: await issueRefreshToken(user.id, persistent),
  };
}

export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);

  if (await users().existsBy({ email: data.email })) {
    throw new AppError("Este e-mail já está em uso", 409);
  }

  const user = await users().save(
    users().create({
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
    }),
  );

  res.status(201).json(await startSession(user, true));
});

authRoutes.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await users()
    .createQueryBuilder("user")
    .addSelect("user.passwordHash")
    .where("user.email = :email", { email: data.email })
    .getOne();

  // Mesma mensagem para e-mail inexistente e senha errada
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new AppError("E-mail ou senha inválidos", 401);
  }

  res.json(await startSession(user, data.remember));
});

authRoutes.post("/refresh", async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  const stored = await refreshTokens().findOne({
    where: { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
    relations: { user: true },
  });

  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Sessão expirada, faça login novamente", 401);
  }

  // Rotação: o token usado é revogado e um novo é emitido
  stored.revokedAt = new Date();
  await refreshTokens().save(stored);

  res.json(await startSession(stored.user, stored.persistent));
});

authRoutes.post("/logout", async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  await refreshTokens().update(
    { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
    { revokedAt: new Date() },
  );

  res.status(204).send();
});

authRoutes.get("/me", ensureAuthenticated, async (req, res) => {
  const user = await users().findOneBy({ id: req.userId });
  if (!user) {
    throw new AppError("Usuário não encontrado", 401);
  }
  res.json(serializeUser(user));
});
