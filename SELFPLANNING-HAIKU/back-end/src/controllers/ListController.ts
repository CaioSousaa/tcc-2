import { Response } from "express";
import { ListService } from "../services/ListService";
import { AuthRequest } from "../middleware/auth";

export class ListController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, title } = req.body;

      if (!boardId || !title) {
        return res.status(400).json({ error: "Board ID and title required" });
      }

      const list = await ListService.createList(boardId, title);
      res.json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getByBoard(req: AuthRequest, res: Response) {
    try {
      const boardId = Array.isArray(req.params.boardId) ? req.params.boardId[0] : req.params.boardId;

      const lists = await ListService.getListsByBoard(boardId);
      res.json(lists);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const listId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title required" });
      }

      const list = await ListService.updateList(listId, title);
      res.json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async reorder(req: AuthRequest, res: Response) {
    try {
      const listId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { position } = req.body;

      if (position === undefined) {
        return res.status(400).json({ error: "Position required" });
      }

      const list = await ListService.reorderList(listId, position);
      res.json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const listId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await ListService.deleteList(listId);
      res.json({ message: "List deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
