import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

@Entity("board_members")
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: "CASCADE" })
  board: Board;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: "varchar", length: 50, default: "editor" })
  role: "admin" | "editor" | "viewer";
}
