import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { ROLES, type Role } from "../shared/roles";
import { Board } from "./Board";
import { User } from "./User";

// RN-B5: a user is a member of a board at most once, with a single role.
@Entity("board_members")
@Unique("uq_board_members_board_user", ["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "enum", enum: [...ROLES], enumName: "board_role" })
  role!: Role;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
