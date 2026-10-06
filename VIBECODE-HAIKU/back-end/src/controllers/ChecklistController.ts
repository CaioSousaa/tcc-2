import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Card } from "../entities/Card";

export class ChecklistController {
  static async create(req: Request, res: Response) {
    const { cardId, title } = req.body;
    const checklistRepo = AppDataSource.getRepository(Checklist);
    const cardRepo = AppDataSource.getRepository(Card);

    const card = await cardRepo.findOne({
      where: { id: cardId },
      relations: ["list", "list.board"] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const checklist = checklistRepo.create({ title, cardId });
    await checklistRepo.save(checklist);

    res.json(checklist);
  }

  static async addItem(req: Request, res: Response) {
    const { checklistId, title } = req.body;
    const itemRepo = AppDataSource.getRepository(ChecklistItem);
    const checklistRepo = AppDataSource.getRepository(Checklist);

    const checklist = await checklistRepo.findOne({
      where: { id: checklistId },
      relations: ["card", "card.list", "card.list.board"] as any,
    });

    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    const maxPosition = await itemRepo
      .createQueryBuilder("item")
      .where("item.checklistId = :checklistId", { checklistId })
      .orderBy("item.position", "DESC")
      .getOne();

    const position = (maxPosition?.position ?? -1) + 1;

    const item = itemRepo.create({ title, checklistId, position });
    await itemRepo.save(item);

    res.json(item);
  }

  static async toggleItem(req: Request, res: Response) {
    const id = req.params.id as string;
    const itemRepo = AppDataSource.getRepository(ChecklistItem);

    const item = await itemRepo.findOne({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    item.completed = !item.completed;
    await itemRepo.save(item);

    res.json(item);
  }

  static async updateItem(req: Request, res: Response) {
    const id = req.params.id as string;
    const { title } = req.body;
    const itemRepo = AppDataSource.getRepository(ChecklistItem);

    const item = await itemRepo.findOne({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    item.title = title;
    await itemRepo.save(item);

    res.json(item);
  }

  static async deleteItem(req: Request, res: Response) {
    const id = req.params.id as string;
    const itemRepo = AppDataSource.getRepository(ChecklistItem);

    const item = await itemRepo.findOne({ where: { id } });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    await itemRepo.remove(item);

    res.json({ success: true });
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const checklistRepo = AppDataSource.getRepository(Checklist);

    const checklist = await checklistRepo.findOne({ where: { id } });

    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    await checklistRepo.remove(checklist);

    res.json({ success: true });
  }
}
