import { AppDataSource } from "../database";
import { Label } from "../entities/Label";
import { CardLabel } from "../entities/CardLabel";

const labelRepository = AppDataSource.getRepository(Label);
const cardLabelRepository = AppDataSource.getRepository(CardLabel);

export class LabelService {
  static async createLabel(boardId: string, title: string, color: string = "#6200EA") {
    const label = labelRepository.create({
      board: { id: boardId },
      title,
      color,
    });

    return await labelRepository.save(label);
  }

  static async getLabelsByBoard(boardId: string) {
    const labels = await labelRepository.find({
      where: { board: { id: boardId } },
    });

    return labels;
  }

  static async addLabelToCard(cardId: string, labelId: string) {
    const existing = await cardLabelRepository.findOne({
      where: { card: { id: cardId }, label: { id: labelId } },
    });

    if (existing) return existing;

    const cardLabel = cardLabelRepository.create({
      card: { id: cardId },
      label: { id: labelId },
    });

    return await cardLabelRepository.save(cardLabel);
  }

  static async removeLabelFromCard(cardId: string, labelId: string) {
    const cardLabel = await cardLabelRepository.findOne({
      where: { card: { id: cardId }, label: { id: labelId } },
    });

    if (cardLabel) {
      await cardLabelRepository.remove(cardLabel);
    }
  }

  static async deleteLabel(labelId: string) {
    const label = await labelRepository.findOneBy({ id: labelId });

    if (!label) throw new Error("Label not found");

    await labelRepository.remove(label);
  }
}
