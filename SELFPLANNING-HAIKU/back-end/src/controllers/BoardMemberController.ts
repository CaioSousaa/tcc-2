import { Response } from "express";
import { BoardMemberService } from "../services/BoardMemberService";
import { AuthRequest } from "../middleware/auth";

export class BoardMemberController {
  static async addMember(req: AuthRequest, res: Response) {
    try {
      const { boardId, userId, role } = req.body;

      if (!boardId || !userId) {
        return res.status(400).json({ error: "Board ID and user ID required" });
      }

      const member = await BoardMemberService.addMember(boardId, userId, role || "editor");
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getMembers(req: AuthRequest, res: Response) {
    try {
      const boardId = Array.isArray(req.params.boardId) ? req.params.boardId[0] : req.params.boardId;

      const members = await BoardMemberService.getMembersOfBoard(boardId);
      res.json(members);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateRole(req: AuthRequest, res: Response) {
    try {
      const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: "Role required" });
      }

      const member = await BoardMemberService.updateMemberRole(memberId, role);
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async removeMember(req: AuthRequest, res: Response) {
    try {
      const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await BoardMemberService.removeMember(memberId);
      res.json({ message: "Member removed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
