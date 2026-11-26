import type { Request, Response } from "express";
import { z } from "zod";
import { requireBoardAccess, requireLabelAccess } from "../services/access";
import { labelRepo } from "../services/repositories";
import { serializeLabel } from "../services/serializers";
import { parseBody } from "../utils/validate";

const colorSchema = z
  .string({ message: "Cor é obrigatória" })
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use o formato #RRGGBB)");

const createLabelSchema = z.object({
  name: z.string().trim().max(60, "Nome muito longo").default(""),
  color: colorSchema,
});

const updateLabelSchema = z.object({
  name: z.string().trim().max(60, "Nome muito longo").optional(),
  color: colorSchema.optional(),
});

export async function createLabel(req: Request, res: Response) {
  const { board } = await requireBoardAccess(
    String(req.params.boardId),
    req.userId,
    "admin",
  );
  const data = parseBody(createLabelSchema, req.body);

  const label = await labelRepo().save(
    labelRepo().create({ name: data.name, color: data.color, boardId: board.id }),
  );
  return res.status(201).json({ label: serializeLabel(label) });
}

export async function updateLabel(req: Request, res: Response) {
  const { label } = await requireLabelAccess(
    String(req.params.labelId),
    req.userId,
    "admin",
  );
  const data = parseBody(updateLabelSchema, req.body);

  if (data.name !== undefined) label.name = data.name;
  if (data.color !== undefined) label.color = data.color;
  const saved = await labelRepo().save(label);
  return res.json({ label: serializeLabel(saved) });
}

export async function deleteLabel(req: Request, res: Response) {
  const { label } = await requireLabelAccess(
    String(req.params.labelId),
    req.userId,
    "admin",
  );
  await labelRepo().delete({ id: label.id });
  return res.status(204).send();
}
