import { ChecklistRepository } from "../repositories/ChecklistRepository";
import { ChecklistItemRepository } from "../repositories/ChecklistItemRepository";
import { CardRepository } from "../repositories/CardRepository";
import { ListRepository } from "../repositories/ListRepository";
import { BoardService } from "./BoardService";
import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";

export class ChecklistService {
  private checklistRepo: ChecklistRepository;
  private itemRepo: ChecklistItemRepository;
  private cardRepo: CardRepository;
  private listRepo: ListRepository;
  private boardService: BoardService;

  constructor() {
    this.checklistRepo = new ChecklistRepository();
    this.itemRepo = new ChecklistItemRepository();
    this.cardRepo = new CardRepository();
    this.listRepo = new ListRepository();
    this.boardService = new BoardService();
  }

  async createChecklist(cardId: string, title: string, userId: string): Promise<Checklist> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    return this.checklistRepo.create(cardId, title);
  }

  async updateChecklistTitle(id: string, title: string, userId: string): Promise<Checklist> {
    const checklist = await this.checklistRepo.findById(id);
    if (!checklist) throw new Error("Checklist não encontrada");

    const card = await this.cardRepo.findById(checklist.cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);

    const updated = await this.checklistRepo.update(id, title);
    if (!updated) throw new Error("Falha ao atualizar checklist");
    return updated;
  }

  async deleteChecklist(id: string, userId: string): Promise<void> {
    const checklist = await this.checklistRepo.findById(id);
    if (!checklist) throw new Error("Checklist não encontrada");

    const card = await this.cardRepo.findById(checklist.cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    await this.checklistRepo.delete(id);
  }

  async createItem(checklistId: string, text: string, userId: string): Promise<ChecklistItem> {
    const checklist = await this.checklistRepo.findById(checklistId);
    if (!checklist) throw new Error("Checklist não encontrada");

    const card = await this.cardRepo.findById(checklist.cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);

    const maxOrder = await this.itemRepo.getMaxOrder(checklistId);
    return this.itemRepo.create(checklistId, text, maxOrder + 1);
  }

  async updateItem(id: string, data: { text?: string; completed?: boolean }, userId: string): Promise<ChecklistItem> {
    const item = await this.itemRepo.findById(id);
    if (!item) throw new Error("Item não encontrado");

    const checklist = await this.checklistRepo.findById(item.checklistId);
    if (!checklist) throw new Error("Checklist não encontrada");

    const card = await this.cardRepo.findById(checklist.cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);

    const updated = await this.itemRepo.update(id, data);
    if (!updated) throw new Error("Falha ao atualizar item");
    return updated;
  }

  async deleteItem(id: string, userId: string): Promise<void> {
    const item = await this.itemRepo.findById(id);
    if (!item) throw new Error("Item não encontrado");

    const checklist = await this.checklistRepo.findById(item.checklistId);
    if (!checklist) throw new Error("Checklist não encontrada");

    const card = await this.cardRepo.findById(checklist.cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    await this.itemRepo.delete(id);
  }
}
