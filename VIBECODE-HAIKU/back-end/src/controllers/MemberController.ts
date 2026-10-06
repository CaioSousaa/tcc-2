import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { BoardMember, BoardRole } from "../entities/BoardMember";
import { CardMember } from "../entities/CardMember";
import { Board } from "../entities/Board";
import { Card } from "../entities/Card";
import { User } from "../entities/User";

export class MemberController {
  static async inviteBoardMember(req: Request, res: Response) {
    const { boardId, userEmail, role = BoardRole.MEMBER } = req.body;
    const boardRepo = AppDataSource.getRepository(Board);
    const userRepo = AppDataSource.getRepository(User);
    const memberRepo = AppDataSource.getRepository(BoardMember);

    const board = await boardRepo.findOne({ where: { id: boardId } });

    if (!board || board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await userRepo.findOne({ where: { email: userEmail } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await memberRepo.findOne({
      where: { boardId, userId: user.id },
    });

    if (existing) {
      return res.status(400).json({ error: "User already a member" });
    }

    const member = memberRepo.create({
      boardId,
      userId: user.id,
      role,
    });

    await memberRepo.save(member);

    const saved = await memberRepo.findOne({
      where: { id: member.id },
      relations: ["user"] as any,
    });

    res.json(saved);
  }

  static async updateMemberRole(req: Request, res: Response) {
    const { boardId, userId, role } = req.body;
    const boardRepo = AppDataSource.getRepository(Board);
    const memberRepo = AppDataSource.getRepository(BoardMember);

    const board = await boardRepo.findOne({ where: { id: boardId } });

    if (!board || board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const member = await memberRepo.findOne({
      where: { boardId, userId },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    member.role = role;
    await memberRepo.save(member);

    res.json(member);
  }

  static async removeBoardMember(req: Request, res: Response) {
    const { boardId, userId } = req.body;
    const boardRepo = AppDataSource.getRepository(Board);
    const memberRepo = AppDataSource.getRepository(BoardMember);

    const board = await boardRepo.findOne({ where: { id: boardId } });

    if (!board || board.ownerId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const member = await memberRepo.findOne({
      where: { boardId, userId },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    await memberRepo.remove(member);

    res.json({ success: true });
  }

  static async assignCard(req: Request, res: Response) {
    const { cardId, userId } = req.body;
    const cardRepo = AppDataSource.getRepository(Card);
    const cardMemberRepo = AppDataSource.getRepository(CardMember);

    const card = await cardRepo.findOne({
      where: { id: cardId },
      relations: ["list", "list.board"] as any,
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const existing = await cardMemberRepo.findOne({
      where: { cardId, userId },
    });

    if (existing) {
      return res.status(400).json({ error: "User already assigned" });
    }

    const cardMember = cardMemberRepo.create({ cardId, userId });
    await cardMemberRepo.save(cardMember);

    const saved = await cardMemberRepo.findOne({
      where: { id: cardMember.id },
      relations: ["user"] as any,
    });

    res.json(saved);
  }

  static async unassignCard(req: Request, res: Response) {
    const { cardId, userId } = req.body;
    const cardMemberRepo = AppDataSource.getRepository(CardMember);

    const cardMember = await cardMemberRepo.findOne({
      where: { cardId, userId },
    });

    if (!cardMember) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    await cardMemberRepo.remove(cardMember);

    res.json({ success: true });
  }
}
