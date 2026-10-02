import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export type BoardRole = "admin" | "member";

export const BOARD_ROLES: BoardRole[] = ["admin", "member"];

@Entity("board_members")
@Unique(["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar", length: 20, default: "member" })
  role!: BoardRole;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
