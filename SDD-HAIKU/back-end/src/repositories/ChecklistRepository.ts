import { Repository } from "typeorm";
import { Checklist } from "../entities/Checklist";
import { AppDataSource } from "../database";

export class ChecklistRepository {
  private repo: Repository<Checklist>;

  constructor() {
    this.repo = AppDataSource.getRepository(Checklist);
  }

  async findById(id: string): Promise<Checklist | null> {
    return this.repo.findOne({
      where: { id },
      relations: { items: true },
    });
  }

  async create(cardId: string, title: string): Promise<Checklist> {
    const checklist = this.repo.create({ cardId, title });
    return this.repo.save(checklist);
  }

  async update(id: string, title: string): Promise<Checklist | null> {
    await this.repo.update(id, { title });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getProgress(id: string): Promise<{ completed: number; total: number }> {
    const checklist = await this.findById(id);
    if (!checklist) return { completed: 0, total: 0 };

    const completed = checklist.items?.filter((i) => i.completed).length || 0;
    const total = checklist.items?.length || 0;
    return { completed, total };
  }
}
