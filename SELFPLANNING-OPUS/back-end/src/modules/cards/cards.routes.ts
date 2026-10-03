import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../../database";
import { BoardList } from "../../entities/BoardList";
import { BoardMember } from "../../entities/BoardMember";
import { Card } from "../../entities/Card";
import { Checklist } from "../../entities/Checklist";
import { Comment } from "../../entities/Comment";
import { Label } from "../../entities/Label";
import { AppError, notFound } from "../../errors/AppError";
import { requireBoardRole } from "../../middlewares/boardAccess";
import { clampIndex, persistOrder } from "../../utils/positions";
import { idParam, uuid } from "../../utils/validate";
import { serializeCardDetail, serializeChecklist, serializeComment } from "../serializers";
import { findCardInBoard, loadCardDetail } from "./cards.queries";

const updateCardSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título do card").max(200),
    description: z.string().max(5000).nullable(),
    dueDate: z.coerce.date().nullable(),
    completed: z.boolean(),
  })
  .partial();

const moveCardSchema = z.object({
  listId: uuid,
  position: z.number().int().min(0),
});

const createChecklistSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do checklist").max(120),
});

const assigneeSchema = z.object({ userId: uuid });
const cardLabelSchema = z.object({ labelId: uuid });
const commentSchema = z.object({
  content: z.string().trim().min(1, "O comentário não pode ficar vazio").max(5000),
});

const cardId = (req: Request) => idParam(req, "cardId");

async function sendCardDetail(res: Response, boardId: string, id: string) {
  const { card, commentCount } = await loadCardDetail(boardId, id);
  res.json(serializeCardDetail(card, commentCount));
}

export const cardsRoutes = Router({ mergeParams: true });

cardsRoutes.get("/:cardId", requireBoardRole("viewer"), async (req, res) => {
  await sendCardDetail(res, req.membership.boardId, cardId(req));
});

cardsRoutes.patch("/:cardId", requireBoardRole("editor"), async (req, res) => {
  const data = updateCardSchema.parse(req.body);
  const boardId = req.membership.boardId;
  const card = await findCardInBoard(boardId, cardId(req));

  if (Object.keys(data).length > 0) {
    await AppDataSource.getRepository(Card).update({ id: card.id }, data);
  }
  await sendCardDetail(res, boardId, card.id);
});

cardsRoutes.delete("/:cardId", requireBoardRole("editor"), async (req, res) => {
  const card = await findCardInBoard(req.membership.boardId, cardId(req));

  await AppDataSource.transaction(async (manager) => {
    await manager.delete(Card, { id: card.id });
    const siblings = await manager.find(Card, {
      where: { listId: card.listId },
      order: { position: "ASC" },
    });
    await persistOrder(manager, Card, siblings);
  });

  res.status(204).send();
});

/**
 * Move o card para `position` dentro de `listId` (mesma lista ou outra lista
 * do mesmo quadro), reajustando as posições das listas de origem e destino.
 */
cardsRoutes.patch("/:cardId/move", requireBoardRole("editor"), async (req, res) => {
  const { listId, position } = moveCardSchema.parse(req.body);
  const boardId = req.membership.boardId;
  const card = await findCardInBoard(boardId, cardId(req));

  await AppDataSource.transaction(async (manager) => {
    const target = await manager.findOneBy(BoardList, { id: listId, boardId });
    if (!target) {
      throw notFound("Lista de destino não encontrada");
    }

    const sourceCards = (
      await manager.find(Card, { where: { listId: card.listId }, order: { position: "ASC" } })
    ).filter((c) => c.id !== card.id);

    const sameList = target.id === card.listId;
    const targetCards = sameList
      ? sourceCards
      : await manager.find(Card, { where: { listId: target.id }, order: { position: "ASC" } });

    if (!sameList) {
      await manager.update(Card, { id: card.id }, { listId: target.id });
      await persistOrder(manager, Card, sourceCards);
    }

    const moving = { ...card, listId: target.id, position: -1 } as Card;
    targetCards.splice(clampIndex(position, targetCards.length), 0, moving);
    await persistOrder(manager, Card, targetCards);
  });

  await sendCardDetail(res, boardId, card.id);
});

cardsRoutes.post("/:cardId/checklists", requireBoardRole("editor"), async (req, res) => {
  const { title } = createChecklistSchema.parse(req.body);
  const card = await findCardInBoard(req.membership.boardId, cardId(req));

  const repo = AppDataSource.getRepository(Checklist);
  const checklist = await repo.save(
    repo.create({ title, cardId: card.id, position: await repo.countBy({ cardId: card.id }) }),
  );

  res.status(201).json(serializeChecklist({ ...checklist, items: [] }));
});

cardsRoutes.post("/:cardId/assignees", requireBoardRole("editor"), async (req, res) => {
  const { userId } = assigneeSchema.parse(req.body);
  const boardId = req.membership.boardId;
  const card = await findCardInBoard(boardId, cardId(req), { assignees: true });

  const isMember = await AppDataSource.getRepository(BoardMember).existsBy({ boardId, userId });
  if (!isMember) {
    throw new AppError("Só é possível atribuir membros do quadro");
  }

  if (!card.assignees.some((user) => user.id === userId)) {
    await AppDataSource.createQueryBuilder()
      .relation(Card, "assignees")
      .of(card.id)
      .add(userId);
  }

  await sendCardDetail(res, boardId, card.id);
});

cardsRoutes.delete(
  "/:cardId/assignees/:userId",
  requireBoardRole("editor"),
  async (req, res) => {
    const boardId = req.membership.boardId;
    const card = await findCardInBoard(boardId, cardId(req));

    await AppDataSource.createQueryBuilder()
      .relation(Card, "assignees")
      .of(card.id)
      .remove(idParam(req, "userId"));

    await sendCardDetail(res, boardId, card.id);
  },
);

cardsRoutes.post("/:cardId/labels", requireBoardRole("editor"), async (req, res) => {
  const { labelId } = cardLabelSchema.parse(req.body);
  const boardId = req.membership.boardId;
  const card = await findCardInBoard(boardId, cardId(req), { labels: true });

  const label = await AppDataSource.getRepository(Label).findOneBy({ id: labelId, boardId });
  if (!label) {
    throw notFound("Etiqueta não encontrada");
  }

  if (!card.labels.some((l) => l.id === label.id)) {
    await AppDataSource.createQueryBuilder()
      .relation(Card, "labels")
      .of(card.id)
      .add(label.id);
  }

  await sendCardDetail(res, boardId, card.id);
});

cardsRoutes.delete(
  "/:cardId/labels/:labelId",
  requireBoardRole("editor"),
  async (req, res) => {
    const boardId = req.membership.boardId;
    const card = await findCardInBoard(boardId, cardId(req));

    await AppDataSource.createQueryBuilder()
      .relation(Card, "labels")
      .of(card.id)
      .remove(idParam(req, "labelId"));

    await sendCardDetail(res, boardId, card.id);
  },
);

cardsRoutes.get("/:cardId/comments", requireBoardRole("viewer"), async (req, res) => {
  const card = await findCardInBoard(req.membership.boardId, cardId(req));

  const comments = await AppDataSource.getRepository(Comment).find({
    where: { cardId: card.id },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });

  res.json(comments.map(serializeComment));
});

cardsRoutes.post("/:cardId/comments", requireBoardRole("editor"), async (req, res) => {
  const { content } = commentSchema.parse(req.body);
  const card = await findCardInBoard(req.membership.boardId, cardId(req));

  const repo = AppDataSource.getRepository(Comment);
  const saved = await repo.save(
    repo.create({ content, cardId: card.id, authorId: req.userId }),
  );

  const comment = await repo.findOneOrFail({
    where: { id: saved.id },
    relations: { author: true },
  });

  res.status(201).json(serializeComment(comment));
});
