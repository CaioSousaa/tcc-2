import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Label } from "../entities/Label";
import { getUserId } from "../utils/auth";
import { getLabelAccess, getMembership, requireAdmin } from "../utils/access";
import { serializeLabel } from "../utils/serializers";
import { labelColorSchema } from "../utils/schemas";

const router = Router();

const labelSchema = z.object({
  name: z
    .string()
    .trim()
    .max(50, "O nome deve ter no máximo 50 caracteres")
    .default(""),
  color: labelColorSchema,
});

const updateLabelSchema = z.object({
  name: z.string().trim().max(50, "O nome deve ter no máximo 50 caracteres").optional(),
  color: labelColorSchema.optional(),
});

router.get("/boards/:boardId/labels", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  const labels = await AppDataSource.getRepository(Label).find({
    where: { boardId: membership.boardId },
    order: { name: "ASC" },
  });
  res.json({ labels: labels.map(serializeLabel) });
});

router.post("/boards/:boardId/labels", async (req, res) => {
  const membership = await getMembership(req.params.boardId, getUserId(res));
  requireAdmin(membership, "Apenas administradores podem criar etiquetas");
  const data = labelSchema.parse(req.body);

  const labels = AppDataSource.getRepository(Label);
  const label = await labels.save(
    labels.create({ boardId: membership.boardId, ...data }),
  );
  res.status(201).json({ label: serializeLabel(label) });
});

router.patch("/labels/:labelId", async (req, res) => {
  const { label, membership } = await getLabelAccess(
    req.params.labelId,
    getUserId(res),
  );
  requireAdmin(membership, "Apenas administradores podem editar etiquetas");
  const data = updateLabelSchema.parse(req.body);

  if (data.name !== undefined) label.name = data.name;
  if (data.color !== undefined) label.color = data.color;
  await AppDataSource.getRepository(Label).save(label);

  res.json({ label: serializeLabel(label) });
});

router.delete("/labels/:labelId", async (req, res) => {
  const { label, membership } = await getLabelAccess(
    req.params.labelId,
    getUserId(res),
  );
  requireAdmin(membership, "Apenas administradores podem excluir etiquetas");

  await AppDataSource.getRepository(Label).delete({ id: label.id });
  res.status(204).send();
});

export default router;
