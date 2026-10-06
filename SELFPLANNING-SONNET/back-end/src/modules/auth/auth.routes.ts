import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./auth.service";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
  remember: z.boolean().default(false),
});

const tokenSchema = z.object({ refreshToken: z.string().min(1) });

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    res.status(201).json(await service.register(data));
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    res.json(await service.login(data));
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = tokenSchema.parse(req.body);
    res.json(await service.refresh(refreshToken));
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const { refreshToken } = tokenSchema.parse(req.body);
    await service.logout(refreshToken);
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await service.me(req.userId));
  }),
);
