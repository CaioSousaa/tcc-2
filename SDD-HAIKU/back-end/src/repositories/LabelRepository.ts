import { Repository } from "typeorm";
import { Label } from "../entities/Label";
import { AppDataSource } from "../database";

export class LabelRepository {
  private repo: Repository<Label>;

  constructor() {
    this.repo = AppDataSource.getRepository(Label);
  }

  async findById(id: string): Promise<Label | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByBoardId(boardId: string): Promise<Label[]> {
    return this.repo.find({ where: { boardId } });
  }

  async create(boardId: string, name: string, color: string): Promise<Label> {
    const label = this.repo.create({ boardId, name, color });
    return this.repo.save(label);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
