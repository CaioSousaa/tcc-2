import { In } from "typeorm";
import { AppDataSource } from "../../database";
import { BoardMember } from "../../entities/BoardMember";
import { Card } from "../../entities/Card";
import { Comment } from "../../entities/Comment";
import { Label } from "../../entities/Label";
import { List } from "../../entities/List";
import { User } from "../../entities/User";
import { AppError } from "../../utils/AppError";
import { moveItem } from "../../utils/reorder";
import { parseDueDate, serializeCard } from "./card.serializer";

const cards = () => AppDataSource.getRepository(Card);

async function loadCard(cardId: string) {
  const card = await cards().findOne({
    where: { id: cardId },
    relations: {
      labels: true,
      assignees: true,
      checklists: { items: true },
    },
  });
  if (!card) throw new AppError(404, "Card não encontrado");
  return card;
}

export async function getCardSummary(cardId: string) {
  const card = await loadCard(cardId);
  const commentCount = await AppDataSource.getRepository(Comment).count({
    where: { cardId },
  });
  return serializeCard(card, commentCount);
}

export async function getCardDetail(cardId: string) {
  const card = await loadCard(cardId);
  const comments = await AppDataSource.getRepository(Comment).find({
    where: { cardId },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });
  const checklists = [...card.checklists]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      id: c.id,
      title: c.title,
      position: c.position,
      items: [...c.items]
        .sort((a, b) => a.position - b.position)
        .map((i) => ({ id: i.id, text: i.text, done: i.done, position: i.position })),
    }));
  return {
    ...serializeCard(card, comments.length),
    checklists,
    comments: comments.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      author: { id: m.author.id, name: m.author.name },
    })),
  };
}

export async function createCard(
  listId: string,
  data: { title: string; description?: string | null; dueDate?: string | null },
) {
  const position = await cards().count({ where: { listId } });
  const card = await cards().save(
    cards().create({
      listId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      dueDate: data.dueDate ? parseDueDate(data.dueDate) : null,
      position,
    }),
  );
  return getCardSummary(card.id);
}

export async function updateCard(
  cardId: string,
  data: { title?: string; description?: string | null; dueDate?: string | null },
) {
  const patch: Partial<Card> = {};
  if (data.title !== undefined) patch.title = data.title.trim();
  if (data.description !== undefined) {
    patch.description = data.description?.trim() || null;
  }
  if (data.dueDate !== undefined) {
    patch.dueDate = data.dueDate ? parseDueDate(data.dueDate) : null;
  }
  if (Object.keys(patch).length > 0) {
    await cards().update({ id: cardId }, patch);
  }
  return getCardSummary(cardId);
}

async function renumber(manager: typeof AppDataSource.manager, ordered: Card[], listId: string) {
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].position !== i || ordered[i].listId !== listId) {
      await manager.update(Card, { id: ordered[i].id }, { listId, position: i });
    }
  }
}

export async function moveCard(
  boardId: string,
  cardId: string,
  targetListId: string,
  position: number,
) {
  await AppDataSource.transaction(async (manager) => {
    const target = await manager.findOne(List, {
      where: { id: targetListId, boardId },
    });
    if (!target) {
      throw new AppError(400, "A lista de destino deve ser do mesmo quadro");
    }
    const card = await manager.findOneByOrFail(Card, { id: cardId });
    const sourceListId = card.listId;

    const targetCards = await manager.find(Card, {
      where: { listId: targetListId },
      order: { position: "ASC" },
    });

    if (sourceListId === targetListId) {
      const from = targetCards.findIndex((c) => c.id === cardId);
      await renumber(manager, moveItem(targetCards, from, position), targetListId);
      return;
    }

    const without = targetCards.filter((c) => c.id !== cardId);
    const index = Math.max(0, Math.min(position, without.length));
    without.splice(index, 0, card);
    await renumber(manager, without, targetListId);

    const sourceCards = await manager.find(Card, {
      where: { listId: sourceListId },
      order: { position: "ASC" },
    });
    await renumber(manager, sourceCards, sourceListId);
  });
}

export async function deleteCard(cardId: string) {
  await AppDataSource.transaction(async (manager) => {
    const card = await manager.findOneByOrFail(Card, { id: cardId });
    await manager.delete(Card, { id: cardId });
    const siblings = await manager.find(Card, {
      where: { listId: card.listId },
      order: { position: "ASC" },
    });
    await renumber(manager, siblings, card.listId);
  });
}

export async function setAssignees(boardId: string, cardId: string, userIds: string[]) {
  const unique = [...new Set(userIds)];
  if (unique.length > 0) {
    const valid = await AppDataSource.getRepository(BoardMember).count({
      where: { boardId, userId: In(unique) },
    });
    if (valid !== unique.length) {
      throw new AppError(400, "Só é possível atribuir membros do quadro");
    }
  }
  const card = await cards().findOneByOrFail({ id: cardId });
  card.assignees = unique.map((id) => ({ id }) as User);
  await cards().save(card);
  return getCardSummary(cardId);
}

export async function setLabels(boardId: string, cardId: string, labelIds: string[]) {
  const unique = [...new Set(labelIds)];
  if (unique.length > 0) {
    const valid = await AppDataSource.getRepository(Label).count({
      where: { boardId, id: In(unique) },
    });
    if (valid !== unique.length) {
      throw new AppError(400, "Só é possível aplicar etiquetas do quadro");
    }
  }
  const card = await cards().findOneByOrFail({ id: cardId });
  card.labels = unique.map((id) => ({ id }) as Label);
  await cards().save(card);
  return getCardSummary(cardId);
}
