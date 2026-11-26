import { Repository } from "typeorm";
import { Card } from "../entities/Card";
import { AppDataSource } from "../database";

export class CardRepository {
  private repo: Repository<Card>;

  constructor() {
    this.repo = AppDataSource.getRepository(Card);
  }

  async findById(id: string): Promise<Card | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        checklists: { items: true },
        comments: { author: true },
        members: { user: true },
        labels: { label: true },
      },
    });
  }

  async findByListId(listId: string): Promise<Card[]> {
    return this.repo.find({
      where: { listId },
      order: { order: "ASC" },
      relations: { members: true, labels: true },
    });
  }

  async create(
    listId: string,
    title: string,
    order: number
  ): Promise<Card> {
    const card = this.repo.create({
      listId,
      title,
      order,
      description: null,
      dueDate: null,
    });
    return this.repo.save(card);
  }

  async update(
    id: string,
    data: { title?: string; description?: string; dueDate?: Date | null }
  ): Promise<Card | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async updateList(id: string, listId: string): Promise<void> {
    await this.repo.update(id, { listId });
  }

  async updateOrder(id: string, order: number): Promise<void> {
    await this.repo.update(id, { order });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getMaxOrder(listId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder("card")
      .where("card.listId = :listId", { listId })
      .select("MAX(card.order)", "maxOrder")
      .getRawOne();
    return result?.maxOrder || 0;
  }
}
