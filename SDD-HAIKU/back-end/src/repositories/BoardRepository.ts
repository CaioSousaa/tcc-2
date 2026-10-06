import { Repository } from "typeorm";
import { Board } from "../entities/Board";
import { AppDataSource } from "../database";

export class BoardRepository {
  private repo: Repository<Board>;

  constructor() {
    this.repo = AppDataSource.getRepository(Board);
  }

  async findById(id: string): Promise<Board | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        owner: true,
        members: true,
        lists: true,
        labels: true,
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Board[]> {
    return this.repo.find({
      where: { ownerId },
      relations: {
        owner: true,
        members: true,
      },
    });
  }

  async create(name: string, ownerId: string): Promise<Board> {
    const board = this.repo.create({ name, ownerId });
    return this.repo.save(board);
  }

  async update(id: string, name: string): Promise<Board | null> {
    await this.repo.update(id, { name });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAll(): Promise<Board[]> {
    return this.repo.find({
      relations: {
        owner: true,
        members: true,
      },
    });
  }
}
