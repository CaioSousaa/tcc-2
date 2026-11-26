import { Response } from "express";
import { BoardService } from "../services/BoardService";
import { AuthRequest } from "../middleware/auth";

export class BoardController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { title, description } = req.body;
      const userId = req.userId!;

      if (!title) {
        return res.status(400).json({ error: "Title required" });
      }

      const board = await BoardService.createBoard(userId, title, description);
      res.json(board);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const boards = await BoardService.getBoardsForUser(userId);
      res.json(boards);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getDetail(req: AuthRequest, res: Response) {
    try {
      const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.userId!;

      const board = await BoardService.getBoardDetail(boardId, userId);
      res.json(board);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { title, description } = req.body;
      const userId = req.userId!;

      if (!title) {
        return res.status(400).json({ error: "Title required" });
      }

      const board = await BoardService.updateBoard(boardId, userId, title, description);
      res.json(board);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const boardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.userId!;

      await BoardService.deleteBoard(boardId, userId);
      res.json({ message: "Board deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
