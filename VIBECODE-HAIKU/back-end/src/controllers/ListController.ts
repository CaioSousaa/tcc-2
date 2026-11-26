import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { List } from "../entities/List";
import { Card } from "../entities/Card";
import { Board } from "../entities/Board";

export class ListController {
  static async create(req: Request, res: Response) {
    const { boardId, name } = req.body;
    const listRepo = AppDataSource.getRepository(List);
    const boardRepo = AppDataSource.getRepository(Board);

    const board = await boardRepo.findOne({ where: { id: boardId } });
    if (!board || board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const maxPosition = await listRepo
      .createQueryBuilder("list")
      .where("list.boardId = :boardId", { boardId })
      .orderBy("list.position", "DESC")
      .getOne();

    const position = (maxPosition?.position ?? -1) + 1;

    const list = listRepo.create({ name, boardId, position });
    await listRepo.save(list);

    res.json(list);
  }

  static async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const { name } = req.body;
    const listRepo = AppDataSource.getRepository(List);

    const list = await listRepo.findOne({
      where: { id },
      relations: ["board"] as any,
    });

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    if (list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    list.name = name;
    await listRepo.save(list);

    res.json(list);
  }

  static async reorder(req: Request, res: Response) {
    const { boardId, lists } = req.body;
    const listRepo = AppDataSource.getRepository(List);
    const boardRepo = AppDataSource.getRepository(Board);

    const board = await boardRepo.findOne({ where: { id: boardId } });
    if (!board || board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    for (let i = 0; i < lists.length; i++) {
      await listRepo.update({ id: lists[i] }, { position: i });
    }

    res.json({ success: true });
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const listRepo = AppDataSource.getRepository(List);
    const cardRepo = AppDataSource.getRepository(Card);

    const list = await listRepo.findOne({
      where: { id },
      relations: ["board"] as any,
    });

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    if (list.board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete all cards in this list
    await cardRepo.delete({ listId: id });

    // Delete the list
    await listRepo.remove(list);

    res.json({ success: true });
  }
}
