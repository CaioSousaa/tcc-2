import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export type BoardRole = "admin" | "member" | "viewer";

/** PK composta: uma pessoa tem no máximo um papel por quadro (RN-22). */
@Entity("board_members")
export class BoardMember {
  @PrimaryColumn({ name: "board_id", type: "uuid" })
  boardId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  @Index()
  userId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column({ type: "enum", enum: ["admin", "member", "viewer"], enumName: "board_role" })
  role!: BoardRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
