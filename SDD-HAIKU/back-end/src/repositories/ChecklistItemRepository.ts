import { Repository } from "typeorm";
import { ChecklistItem } from "../entities/ChecklistItem";
import { AppDataSource } from "../database";

export class ChecklistItemRepository {
  private repo: Repository<ChecklistItem>;

  constructor() {
    this.repo = AppDataSource.getRepository(ChecklistItem);
  }

  async findById(id: string): Promise<ChecklistItem | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(
    checklistId: string,
    text: string,
    order: number
  ): Promise<ChecklistItem> {
    const item = this.repo.create({ checklistId, text, completed: false, order });
    return this.repo.save(item);
  }

  async update(id: string, data: { text?: string; completed?: boolean }): Promise<ChecklistItem | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getMaxOrder(checklistId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder("item")
      .where("item.checklistId = :checklistId", { checklistId })
      .select("MAX(item.order)", "maxOrder")
      .getRawOne();
    return result?.maxOrder || 0;
  }
}
