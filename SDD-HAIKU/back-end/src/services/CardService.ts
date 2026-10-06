import { CardRepository } from "../repositories/CardRepository";
import { ListRepository } from "../repositories/ListRepository";
import { BoardService } from "./BoardService";
import { Card } from "../entities/Card";

export class CardService {
  private cardRepo: CardRepository;
  private listRepo: ListRepository;
  private boardService: BoardService;

  constructor() {
    this.cardRepo = new CardRepository();
    this.listRepo = new ListRepository();
    this.boardService = new BoardService();
  }

  async createCard(
    listId: string,
    title: string,
    userId: string
  ): Promise<Card> {
    const list = await this.listRepo.findById(listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);

    const maxOrder = await this.cardRepo.getMaxOrder(listId);
    return this.cardRepo.create(listId, title, maxOrder + 1);
  }

  async getCardById(id: string, userId: string): Promise<Card> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    return card;
  }

  async updateCard(
    id: string,
    data: { title?: string; description?: string; dueDate?: Date | null },
    userId: string
  ): Promise<Card> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);

    const updated = await this.cardRepo.update(id, data);
    if (!updated) throw new Error("Falha ao atualizar card");
    return updated;
  }

  async deleteCard(id: string, userId: string): Promise<void> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    await this.cardRepo.delete(id);
  }

  async moveCard(
    cardId: string,
    newListId: string,
    userId: string
  ): Promise<Card> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new Error("Card não encontrado");

    const oldList = await this.listRepo.findById(card.listId);
    if (!oldList) throw new Error("Lista origem não encontrada");

    const newList = await this.listRepo.findById(newListId);
    if (!newList) throw new Error("Lista destino não encontrada");

    if (oldList.boardId !== newList.boardId)
      throw new Error("Listas em quadros diferentes");

    await this.boardService.canModify(oldList.boardId, userId);

    const maxOrder = await this.cardRepo.getMaxOrder(newListId);
    await this.cardRepo.updateList(cardId, newListId);
    await this.cardRepo.updateOrder(cardId, maxOrder + 1);

    return this.cardRepo.findById(cardId) as Promise<Card>;
  }

  async reorderCards(
    listId: string,
    cardIds: string[],
    userId: string
  ): Promise<void> {
    const list = await this.listRepo.findById(listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);

    for (let i = 0; i < cardIds.length; i++) {
      await this.cardRepo.updateOrder(cardIds[i], i);
    }
  }
}
