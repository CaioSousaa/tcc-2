import { Repository } from "typeorm";
import { CardLabel } from "../entities/CardLabel";
import { AppDataSource } from "../database";

export class CardLabelRepository {
  private repo: Repository<CardLabel>;

  constructor() {
    this.repo = AppDataSource.getRepository(CardLabel);
  }

  async findByCardAndLabel(cardId: string, labelId: string): Promise<CardLabel | null> {
    return this.repo.findOne({ where: { cardId, labelId } });
  }

  async create(cardId: string, labelId: string): Promise<CardLabel> {
    const label = this.repo.create({ cardId, labelId });
    return this.repo.save(label);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
