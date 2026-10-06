import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { Label } from "../../entities/Label";
import { notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { hexColor, idParam } from "../../utils/validate";
import { serializeLabel } from "../serializers";

const labelSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da etiqueta").max(40),
  color: hexColor,
});

const labels = () => AppDataSource.getRepository(Label);

async function findLabelInBoard(boardId: string, labelId: string) {
  const label = await labels().findOneBy({ id: labelId, boardId });
  if (!label) {
    throw notFound("Etiqueta não encontrada");
  }
  return label;
}

export const labelsRoutes = Router({ mergeParams: true });

labelsRoutes.get("/", requireBoardRole("viewer"), async (req, res) => {
  const list = await labels().find({
    where: { boardId: req.membership.boardId },
    order: { createdAt: "ASC" },
  });
  res.json(list.map(serializeLabel));
});

labelsRoutes.post("/", requireBoardRole("editor"), async (req, res) => {
  const data = labelSchema.parse(req.body);
  const label = await labels().save(
    labels().create({ ...data, boardId: req.membership.boardId }),
  );
  res.status(201).json(serializeLabel(label));
});

labelsRoutes.patch("/:labelId", requireBoardRole("editor"), async (req, res) => {
  const data = labelSchema.partial().parse(req.body);
  const label = await findLabelInBoard(req.membership.boardId, idParam(req, "labelId"));

  labels().merge(label, data);
  await labels().save(label);
  res.json(serializeLabel(label));
});

labelsRoutes.delete("/:labelId", requireBoardRole("editor"), async (req, res) => {
  const label = await findLabelInBoard(req.membership.boardId, idParam(req, "labelId"));
  // As associações em card_labels são removidas em cascata
  await labels().delete({ id: label.id });
  res.status(204).send();
});
