import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";
import type { BoardRole } from "./BoardMember";

@Entity("board_invitations")
@Unique(["boardId", "email"])
export class BoardInvitation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Relation<Board>;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 20, default: "member" })
  role!: BoardRole;

  @Column({ type: "uuid" })
  invitedById!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invitedById" })
  invitedBy!: Relation<User>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
