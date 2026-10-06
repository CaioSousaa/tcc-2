import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Comment } from "../entities/Comment";
import { Card } from "../entities/Card";

export class CommentController {
  static async create(req: Request, res: Response) {
    const { cardId, content } = req.body;
    const commentRepo = AppDataSource.getRepository(Comment);
    const cardRepo = AppDataSource.getRepository(Card);

    const card = await cardRepo.findOne({
      where: { id: cardId },
      relations: ["list", "list.board"] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const comment = commentRepo.create({
      content,
      cardId,
      userId: req.userId,
    });

    await commentRepo.save(comment);

    const saved = await commentRepo.findOne({
      where: { id: comment.id },
      relations: ["user"] as any,
    });

    res.json(saved);
  }

  static async getList(req: Request, res: Response) {
    const cardId = req.params.cardId as string;
    const commentRepo = AppDataSource.getRepository(Comment);

    const comments = await commentRepo.find({
      where: { cardId },
      relations: ["user"] as any,
      order: { createdAt: "ASC" },
    });

    res.json(comments);
  }

  static async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const { content } = req.body;
    const commentRepo = AppDataSource.getRepository(Comment);

    const comment = await commentRepo.findOne({ where: { id } });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    comment.content = content;
    await commentRepo.save(comment);

    const saved = await commentRepo.findOne({
      where: { id: comment.id },
      relations: ["user"] as any,
    });

    res.json(saved);
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const commentRepo = AppDataSource.getRepository(Comment);

    const comment = await commentRepo.findOne({ where: { id } });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await commentRepo.remove(comment);

    res.json({ success: true });
  }
}
