import { AppDataSource } from "../database";
import { Card } from "../entities/Card";
import { Comment } from "../entities/Comment";
import { Checklist } from "../entities/Checklist";

const cardRepository = AppDataSource.getRepository(Card);
const commentRepository = AppDataSource.getRepository(Comment);
const checklistRepository = AppDataSource.getRepository(Checklist);

export class CardService {
  static async createCard(listId: string, title: string, description?: string) {
    const maxPosition = await cardRepository
      .createQueryBuilder("card")
      .where("card.list.id = :listId", { listId })
      .select("MAX(card.position)", "max")
      .getRawOne();

    const position = (maxPosition?.max || 0) + 1;

    const card = cardRepository.create({
      list: { id: listId },
      title,
      description: description || "",
      position,
    });

    return await cardRepository.save(card);
  }

  static async getCardsByList(listId: string) {
    const cards = await cardRepository.find({
      where: { list: { id: listId } },
      relations: { assignees: { user: true }, checklists: { items: true }, comments: { user: true }, labels: { label: true } },
      order: { position: "ASC" },
    });

    return cards;
  }

  static async getCardDetail(cardId: string) {
    const card = await cardRepository.findOne({
      where: { id: cardId },
      relations: { assignees: { user: true }, checklists: { items: true }, comments: { user: true }, labels: { label: true } },
    });

    if (!card) throw new Error("Card not found");

    return card;
  }

  static async updateCard(cardId: string, title: string, description: string, dueDate?: Date) {
    const card = await cardRepository.findOneBy({ id: cardId });

    if (!card) throw new Error("Card not found");

    card.title = title;
    card.description = description;
    if (dueDate) card.dueDate = dueDate;

    return await cardRepository.save(card);
  }

  static async moveCard(cardId: string, newListId: string, newPosition: number) {
    const card = await cardRepository.findOneBy({ id: cardId });

    if (!card) throw new Error("Card not found");

    card.list = { id: newListId } as any;
    card.position = newPosition;

    return await cardRepository.save(card);
  }

  static async deleteCard(cardId: string) {
    const card = await cardRepository.findOneBy({ id: cardId });

    if (!card) throw new Error("Card not found");

    await cardRepository.remove(card);
  }

  static async addComment(cardId: string, userId: string, content: string) {
    const comment = commentRepository.create({
      card: { id: cardId },
      user: { id: userId },
      content,
    });

    return await commentRepository.save(comment);
  }

  static async getComments(cardId: string) {
    const comments = await commentRepository.find({
      where: { card: { id: cardId } },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });

    return comments;
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await commentRepository.findOne({
      where: { id: commentId },
      relations: { user: true },
    });

    if (!comment) throw new Error("Comment not found");
    if (comment.user.id !== userId) throw new Error("Unauthorized");

    await commentRepository.remove(comment);
  }
}
