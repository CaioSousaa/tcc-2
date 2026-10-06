import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";
import { Board } from "./Board";

export enum BoardRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  OBSERVER = "observer",
}

@Entity("board_members")
export class BoardMember {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  boardId!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({
    type: "enum",
    enum: BoardRole,
    default: BoardRole.MEMBER,
  })
  role!: BoardRole;

  @CreateDateColumn()
  joinedAt!: Date;

  @ManyToOne(() => Board, (board) => board.members)
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;
}
