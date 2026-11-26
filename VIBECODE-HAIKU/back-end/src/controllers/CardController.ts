import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { Board } from "../entities/Board";

export class CardController {
  static async create(req: Request, res: Response) {
    const { listId, title, description } = req.body;
    const cardRepo = AppDataSource.getRepository(Card);
    const listRepo = AppDataSource.getRepository(List);

    const list = await listRepo.findOne({
      where: { id: listId },
      relations: ["board"] as any,
    });

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    if (list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const maxPosition = await cardRepo
      .createQueryBuilder("card")
      .where("card.listId = :listId", { listId })
      .orderBy("card.position", "DESC")
      .getOne();

    const position = (maxPosition?.position ?? -1) + 1;

    const card = cardRepo.create({
      title,
      description,
      listId,
      position,
    });

    await cardRepo.save(card);

    res.json(card);
  }

  static async get(req: Request, res: Response) {
    const id = req.params.id as string;
    const cardRepo = AppDataSource.getRepository(Card);

    const card = await cardRepo.findOne({
      where: { id },
      relations: [
        "list",
        "list.board",
        "comments",
        "comments.user",
        "checklists",
        "checklists.items",
        "cardLabels",
        "cardLabels.label",
        "assignees",
        "assignees.user",
      ] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(card);
  }

  static async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const { title, description, dueDate } = req.body;
    const cardRepo = AppDataSource.getRepository(Card);

    const card = await cardRepo.findOne({
      where: { id },
      relations: ["list", "list.board"] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (title) card.title = title;
    if (description !== undefined) card.description = description;
    if (dueDate !== undefined) card.dueDate = dueDate;

    await cardRepo.save(card);

    res.json(card);
  }

  static async move(req: Request, res: Response) {
    const id = req.params.id as string;
    const { listId, position } = req.body;
    const cardRepo = AppDataSource.getRepository(Card);
    const listRepo = AppDataSource.getRepository(List);

    const card = await cardRepo.findOne({
      where: { id },
      relations: ["list", "list.board"] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newList = await listRepo.findOne({
      where: { id: listId },
      relations: ["board"] as any,
    });

    if (!newList || newList.board.id !== card.list.boardId) {
      return res.status(400).json({ error: "Invalid list" });
    }

    card.listId = listId;
    card.position = position;

    await cardRepo.save(card);

    res.json(card);
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const cardRepo = AppDataSource.getRepository(Card);

    const card = await cardRepo.findOne({
      where: { id },
      relations: ["list", "list.board"] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await cardRepo.remove(card);

    res.json({ success: true });
  }
}
