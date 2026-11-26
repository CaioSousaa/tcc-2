import { Response } from "express";
import { LabelService } from "../services/LabelService";
import { AuthRequest } from "../middleware/auth";

export class LabelController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { boardId, title, color } = req.body;

      if (!boardId || !title) {
        return res.status(400).json({ error: "Board ID and title required" });
      }

      const label = await LabelService.createLabel(boardId, title, color);
      res.json(label);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getByBoard(req: AuthRequest, res: Response) {
    try {
      const boardId = Array.isArray(req.params.boardId) ? req.params.boardId[0] : req.params.boardId;

      const labels = await LabelService.getLabelsByBoard(boardId);
      res.json(labels);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const labelId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await LabelService.deleteLabel(labelId);
      res.json({ message: "Label deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
