import { Repository } from "typeorm";
import { BoardMember, BoardRole } from "../entities/BoardMember";
import { AppDataSource } from "../database";

export class BoardMemberRepository {
  private repo: Repository<BoardMember>;

  constructor() {
    this.repo = AppDataSource.getRepository(BoardMember);
  }

  async findById(id: string): Promise<BoardMember | null> {
    return this.repo.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async findByBoardAndUser(boardId: string, userId: string): Promise<BoardMember | null> {
    return this.repo.findOne({ where: { boardId, userId } });
  }

  async create(boardId: string, userId: string, role: BoardRole): Promise<BoardMember> {
    const member = this.repo.create({ boardId, userId, role });
    return this.repo.save(member);
  }

  async update(id: string, role: BoardRole): Promise<BoardMember | null> {
    await this.repo.update(id, { role });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
