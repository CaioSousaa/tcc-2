import { Repository } from "typeorm";
import { CardMember } from "../entities/CardMember";
import { AppDataSource } from "../database";

export class CardMemberRepository {
  private repo: Repository<CardMember>;

  constructor() {
    this.repo = AppDataSource.getRepository(CardMember);
  }

  async findByCardAndUser(cardId: string, userId: string): Promise<CardMember | null> {
    return this.repo.findOne({ where: { cardId, userId } });
  }

  async create(cardId: string, userId: string): Promise<CardMember> {
    const member = this.repo.create({ cardId, userId });
    return this.repo.save(member);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
