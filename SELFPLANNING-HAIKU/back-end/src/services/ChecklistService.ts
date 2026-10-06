import { AppDataSource } from "../database";
import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";

const checklistRepository = AppDataSource.getRepository(Checklist);
const checklistItemRepository = AppDataSource.getRepository(ChecklistItem);

export class ChecklistService {
  static async createChecklist(cardId: string, title: string) {
    const checklist = checklistRepository.create({
      card: { id: cardId },
      title,
    });

    return await checklistRepository.save(checklist);
  }

  static async addItem(checklistId: string, title: string) {
    const item = checklistItemRepository.create({
      checklist: { id: checklistId },
      title,
      completed: false,
    });

    return await checklistItemRepository.save(item);
  }

  static async toggleItem(itemId: string) {
    const item = await checklistItemRepository.findOneBy({ id: itemId });

    if (!item) throw new Error("Checklist item not found");

    item.completed = !item.completed;
    return await checklistItemRepository.save(item);
  }

  static async deleteItem(itemId: string) {
    const item = await checklistItemRepository.findOneBy({ id: itemId });

    if (!item) throw new Error("Checklist item not found");

    await checklistItemRepository.remove(item);
  }

  static async deleteChecklist(checklistId: string) {
    const checklist = await checklistRepository.findOneBy({ id: checklistId });

    if (!checklist) throw new Error("Checklist not found");

    await checklistRepository.remove(checklist);
  }

  static calculateProgress(checklist: Checklist): number {
    if (!checklist.items || checklist.items.length === 0) return 0;

    const completed = checklist.items.filter((item) => item.completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  }
}
