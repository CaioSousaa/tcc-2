import { AppDataSource } from "../database";
import { BoardMember } from "../entities/BoardMember";
import { CardAssignee } from "../entities/CardAssignee";

const boardMemberRepository = AppDataSource.getRepository(BoardMember);
const cardAssigneeRepository = AppDataSource.getRepository(CardAssignee);

export class BoardMemberService {
  static async addMember(boardId: string, userId: string, role: "admin" | "editor" | "viewer" = "editor") {
    const existing = await boardMemberRepository.findOne({
      where: { board: { id: boardId }, user: { id: userId } },
    });

    if (existing) return existing;

    const member = boardMemberRepository.create({
      board: { id: boardId },
      user: { id: userId },
      role,
    });

    return await boardMemberRepository.save(member);
  }

  static async getMembersOfBoard(boardId: string) {
    const members = await boardMemberRepository.find({
      where: { board: { id: boardId } },
      relations: { user: true },
    });

    return members;
  }

  static async updateMemberRole(memberId: string, role: "admin" | "editor" | "viewer") {
    const member = await boardMemberRepository.findOneBy({ id: memberId });

    if (!member) throw new Error("Member not found");

    member.role = role;
    return await boardMemberRepository.save(member);
  }

  static async removeMember(memberId: string) {
    const member = await boardMemberRepository.findOneBy({ id: memberId });

    if (!member) throw new Error("Member not found");

    await boardMemberRepository.remove(member);
  }

  static async assignCardToUser(cardId: string, userId: string) {
    const existing = await cardAssigneeRepository.findOne({
      where: { card: { id: cardId }, user: { id: userId } },
    });

    if (existing) return existing;

    const assignee = cardAssigneeRepository.create({
      card: { id: cardId },
      user: { id: userId },
    });

    return await cardAssigneeRepository.save(assignee);
  }

  static async unassignCardFromUser(cardId: string, userId: string) {
    const assignee = await cardAssigneeRepository.findOne({
      where: { card: { id: cardId }, user: { id: userId } },
    });

    if (assignee) {
      await cardAssigneeRepository.remove(assignee);
    }
  }
}
