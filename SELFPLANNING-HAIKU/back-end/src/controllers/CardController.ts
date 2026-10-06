import { Response } from "express";
import { CardService } from "../services/CardService";
import { ChecklistService } from "../services/ChecklistService";
import { LabelService } from "../services/LabelService";
import { BoardMemberService } from "../services/BoardMemberService";
import { AuthRequest } from "../middleware/auth";

export class CardController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { listId, title, description } = req.body;

      if (!listId || !title) {
        return res.status(400).json({ error: "List ID and title required" });
      }

      const card = await CardService.createCard(listId, title, description);
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getByList(req: AuthRequest, res: Response) {
    try {
      const listId = Array.isArray(req.params.listId) ? req.params.listId[0] : req.params.listId;

      const cards = await CardService.getCardsByList(listId);
      res.json(cards);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getDetail(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const card = await CardService.getCardDetail(cardId);
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { title, description, dueDate } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title required" });
      }

      const card = await CardService.updateCard(cardId, title, description, dueDate ? new Date(dueDate) : undefined);
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async move(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { newListId, position } = req.body;

      if (!newListId || position === undefined) {
        return res.status(400).json({ error: "New list ID and position required" });
      }

      const card = await CardService.moveCard(cardId, newListId, position);
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await CardService.deleteCard(cardId);
      res.json({ message: "Card deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Checklist endpoints
  static async createChecklist(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title required" });
      }

      const checklist = await ChecklistService.createChecklist(cardId, title);
      res.json(checklist);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async addChecklistItem(req: AuthRequest, res: Response) {
    try {
      const checklistId = Array.isArray(req.params.checklistId) ? req.params.checklistId[0] : req.params.checklistId;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title required" });
      }

      const item = await ChecklistService.addItem(checklistId, title);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async toggleChecklistItem(req: AuthRequest, res: Response) {
    try {
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;

      const item = await ChecklistService.toggleItem(itemId);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteChecklistItem(req: AuthRequest, res: Response) {
    try {
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;

      await ChecklistService.deleteItem(itemId);
      res.json({ message: "Item deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Comment endpoints
  static async addComment(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
      const { content } = req.body;
      const userId = req.userId!;

      if (!content) {
        return res.status(400).json({ error: "Content required" });
      }

      const comment = await CardService.addComment(cardId, userId, content);
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getComments(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;

      const comments = await CardService.getComments(cardId);
      res.json(comments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteComment(req: AuthRequest, res: Response) {
    try {
      const commentId = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
      const userId = req.userId!;

      await CardService.deleteComment(commentId, userId);
      res.json({ message: "Comment deleted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Label endpoints
  static async addLabel(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
      const { labelId } = req.body;

      if (!labelId) {
        return res.status(400).json({ error: "Label ID required" });
      }

      const cardLabel = await LabelService.addLabelToCard(cardId, labelId);
      res.json(cardLabel);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async removeLabel(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
      const labelId = Array.isArray(req.params.labelId) ? req.params.labelId[0] : req.params.labelId;

      await LabelService.removeLabelFromCard(cardId, labelId);
      res.json({ message: "Label removed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Assignee endpoints
  static async assignUser(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const assignee = await BoardMemberService.assignCardToUser(cardId, userId);
      res.json(assignee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unassignUser(req: AuthRequest, res: Response) {
    try {
      const cardId = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      await BoardMemberService.unassignCardFromUser(cardId, userId);
      res.json({ message: "User unassigned" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
