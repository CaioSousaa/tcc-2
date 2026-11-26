import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { userRepo } from "../services/repositories";
import { serializeUser } from "../services/serializers";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";
import { parseBody } from "../utils/validate";

const registerSchema = z.object({
  name: z
    .string({ message: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(120, "Nome muito longo"),
  email: z
    .string({ message: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .pipe(z.email("E-mail inválido")),
  password: z
    .string({ message: "Senha é obrigatória" })
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(100, "Senha muito longa"),
});

const loginSchema = z.object({
  email: z
    .string({ message: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .pipe(z.email("E-mail inválido")),
  password: z.string({ message: "Senha é obrigatória" }).min(1, "Senha é obrigatória"),
});

export async function register(req: Request, res: Response) {
  const data = parseBody(registerSchema, req.body);

  const exists = await userRepo().existsBy({ email: data.email });
  if (exists) {
    throw new AppError(409, "Este e-mail já está cadastrado", "EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await userRepo().save(
    userRepo().create({ name: data.name, email: data.email, passwordHash }),
  );

  return res
    .status(201)
    .json({ token: signToken(user.id), user: serializeUser(user) });
}

export async function login(req: Request, res: Response) {
  const data = parseBody(loginSchema, req.body);

  const user = await userRepo().findOne({
    where: { email: data.email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  const valid = user
    ? await bcrypt.compare(data.password, user.passwordHash)
    : false;
  if (!user || !valid) {
    throw new AppError(401, "E-mail ou senha inválidos", "INVALID_CREDENTIALS");
  }

  return res.json({ token: signToken(user.id), user: serializeUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await userRepo().findOneBy({ id: req.userId });
  if (!user) {
    throw new AppError(401, "Usuário não encontrado", "UNAUTHORIZED");
  }
  return res.json({ user: serializeUser(user) });
}
