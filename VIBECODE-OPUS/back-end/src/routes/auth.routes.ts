import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AppDataSource } from "../database";
import { User } from "../entities/User";
import { requireAuth } from "../middlewares/auth";
import { signToken, getUserId } from "../utils/auth";
import { conflict, unauthorized } from "../utils/HttpError";
import { publicUser } from "../utils/serializers";
import { emailSchema } from "../utils/schemas";

const router = Router();

const registerSchema = z.object({
  name: z
    .string({ error: "Informe o nome" })
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  email: emailSchema,
  password: z
    .string({ error: "Informe a senha" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Informe a senha" }).min(1, "Informe a senha"),
  remember: z.boolean().default(true),
});

router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const users = AppDataSource.getRepository(User);

  if (await users.existsBy({ email: data.email })) {
    throw conflict("Já existe uma conta com este e-mail", "EMAIL_IN_USE");
  }

  const user = await users.save(
    users.create({
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
    }),
  );

  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await AppDataSource.getRepository(User).findOneBy({
    email: data.email,
  });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw unauthorized("E-mail ou senha inválidos");
  }

  res.json({
    token: signToken(user.id, data.remember),
    user: publicUser(user),
  });
});

router.get("/me", requireAuth, async (_req, res) => {
  const user = await AppDataSource.getRepository(User).findOneBy({
    id: getUserId(res),
  });
  if (!user) throw unauthorized("Usuário não encontrado");

  res.json({ user: publicUser(user) });
});

export default router;
