import type { FindOptionsRelations } from "typeorm";
import { AppDataSource } from "../../database";
import { Card } from "../../entities/Card";
import { Comment } from "../../entities/Comment";
import { notFound } from "../../errors/AppError";

export async function commentCountsByCard(cardIds: string[]) {
  const counts = new Map<string, number>();
  if (cardIds.length === 0) {
    return counts;
  }

  const rows = await AppDataSource.getRepository(Comment)
    .createQueryBuilder("comment")
    .select("comment.card_id", "cardId")
    .addSelect("COUNT(*)::int", "count")
    .where("comment.card_id IN (:...cardIds)", { cardIds })
    .groupBy("comment.card_id")
    .getRawMany<{ cardId: string; count: number }>();

  for (const row of rows) {
    counts.set(row.cardId, row.count);
  }
  return counts;
}

export const CARD_DETAIL_RELATIONS: FindOptionsRelations<Card> = {
  list: true,
  labels: true,
  assignees: true,
  checklists: { items: true },
};

/** Busca um card garantindo que ele pertence ao quadro informado. */
export async function findCardInBoard(
  boardId: string,
  cardId: string,
  relations: FindOptionsRelations<Card> = {},
): Promise<Card> {
  const card = await AppDataSource.getRepository(Card).findOne({
    where: { id: cardId, list: { boardId } },
    relations,
    relationLoadStrategy: "query",
  });

  if (!card) {
    throw notFound("Card não encontrado");
  }
  return card;
}

export async function loadCardDetail(boardId: string, cardId: string) {
  const card = await findCardInBoard(boardId, cardId, CARD_DETAIL_RELATIONS);
  const counts = await commentCountsByCard([card.id]);
  return { card, commentCount: counts.get(card.id) ?? 0 };
}
