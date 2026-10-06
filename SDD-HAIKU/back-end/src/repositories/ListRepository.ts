import { Repository } from "typeorm";
import { List } from "../entities/List";
import { AppDataSource } from "../database";

export class ListRepository {
  private repo: Repository<List>;

  constructor() {
    this.repo = AppDataSource.getRepository(List);
  }

  async findById(id: string): Promise<List | null> {
    return this.repo.findOne({ where: { id }, relations: { cards: true } });
  }

  async findByBoardId(boardId: string): Promise<List[]> {
    return this.repo.find({
      where: { boardId },
      relations: { cards: true },
      order: { order: "ASC" },
    });
  }

  async create(boardId: string, name: string, order: number): Promise<List> {
    const list = this.repo.create({ boardId, name, order });
    return this.repo.save(list);
  }

  async update(id: string, name: string): Promise<List | null> {
    await this.repo.update(id, { name });
    return this.findById(id);
  }

  async updateOrder(id: string, order: number): Promise<void> {
    await this.repo.update(id, { order });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getMaxOrder(boardId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder("list")
      .where("list.boardId = :boardId", { boardId })
      .select("MAX(list.order)", "maxOrder")
      .getRawOne();
    return result?.maxOrder || 0;
  }
}
