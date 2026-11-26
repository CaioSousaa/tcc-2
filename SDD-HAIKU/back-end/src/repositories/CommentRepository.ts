import { Repository, IsNull } from "typeorm";
import { Comment } from "../entities/Comment";
import { AppDataSource } from "../database";

export class CommentRepository {
  private repo: Repository<Comment>;

  constructor() {
    this.repo = AppDataSource.getRepository(Comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.repo.findOne({
      where: { id },
      relations: { author: true },
    });
  }

  async findByCardId(cardId: string): Promise<Comment[]> {
    return this.repo.find({
      where: { cardId, deletedAt: IsNull() },
      relations: { author: true },
      order: { createdAt: "ASC" },
    });
  }

  async create(cardId: string, authorId: string, text: string): Promise<Comment> {
    const comment = this.repo.create({ cardId, authorId, text });
    return this.repo.save(comment);
  }

  async update(id: string, text: string): Promise<Comment | null> {
    await this.repo.update(id, { text });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.update(id, { deletedAt: new Date() });
  }
}
