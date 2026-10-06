import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export const BOARD_ROLES = ["admin", "editor", "viewer"] as const;
export type BoardRole = (typeof BOARD_ROLES)[number];

@Entity("board_members")
@Unique(["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column({ type: "enum", enum: BOARD_ROLES, default: "editor" })
  role!: BoardRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
