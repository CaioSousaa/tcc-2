import { AppDataSource } from "../database";
import { User } from "../entities/User";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { BoardInvitation } from "../entities/BoardInvitation";
import { List } from "../entities/List";
import { Card } from "../entities/Card";
import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Label } from "../entities/Label";
import { Comment } from "../entities/Comment";

export const userRepo = () => AppDataSource.getRepository(User);
export const boardRepo = () => AppDataSource.getRepository(Board);
export const memberRepo = () => AppDataSource.getRepository(BoardMember);
export const invitationRepo = () => AppDataSource.getRepository(BoardInvitation);
export const listRepo = () => AppDataSource.getRepository(List);
export const cardRepo = () => AppDataSource.getRepository(Card);
export const checklistRepo = () => AppDataSource.getRepository(Checklist);
export const checklistItemRepo = () =>
  AppDataSource.getRepository(ChecklistItem);
export const labelRepo = () => AppDataSource.getRepository(Label);
export const commentRepo = () => AppDataSource.getRepository(Comment);
