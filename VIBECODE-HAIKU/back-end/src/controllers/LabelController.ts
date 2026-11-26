import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Label } from "../entities/Label";
import { CardLabel } from "../entities/CardLabel";
import { Board } from "../entities/Board";

export class LabelController {
  static async create(req: Request, res: Response) {
    const { boardId, name, color } = req.body;
    const labelRepo = AppDataSource.getRepository(Label);
    const boardRepo = AppDataSource.getRepository(Board);

    const board = await boardRepo.findOne({ where: { id: boardId } });

    if (!board || board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const label = labelRepo.create({ name, color, boardId });
    await labelRepo.save(label);

    res.json(label);
  }

  static async addToCard(req: Request, res: Response) {
    const { cardId, labelId } = req.body;
    const cardLabelRepo = AppDataSource.getRepository(CardLabel);

    const existing = await cardLabelRepo.findOne({
      where: { cardId, labelId },
    });

    if (existing) {
      return res.status(400).json({ error: "Label already added" });
    }

    const cardLabel = cardLabelRepo.create({ cardId, labelId });
    await cardLabelRepo.save(cardLabel);

    const saved = await cardLabelRepo.findOne({
      where: { id: cardLabel.id },
      relations: ["label"] as any,
    });

    res.json(saved);
  }

  static async removeFromCard(req: Request, res: Response) {
    const { cardId, labelId } = req.body;
    const cardLabelRepo = AppDataSource.getRepository(CardLabel);

    const cardLabel = await cardLabelRepo.findOne({
      where: { cardId, labelId },
    });

    if (!cardLabel) {
      return res.status(404).json({ error: "Label not found on card" });
    }

    await cardLabelRepo.remove(cardLabel);

    res.json({ success: true });
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const labelRepo = AppDataSource.getRepository(Label);

    const label = await labelRepo.findOne({
      where: { id },
      relations: ["board"] as any,
    });

    if (!label) {
      return res.status(404).json({ error: "Label not found" });
    }

    if (label.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await labelRepo.remove(label);

    res.json({ success: true });
  }
}
