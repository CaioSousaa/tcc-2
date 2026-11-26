import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Board } from "./Board";

export enum BoardRole {
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer",
}

@Entity("board_members")
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  boardId!: string;

  @Column({ type: "enum", enum: BoardRole, default: BoardRole.MEMBER })
  role!: BoardRole;

  @CreateDateColumn()
  joinedAt!: Date;

  @ManyToOne(() => User, (user) => user.boardMemberships)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Board, (board) => board.members)
  @JoinColumn({ name: "boardId" })
  board!: Board;
}
