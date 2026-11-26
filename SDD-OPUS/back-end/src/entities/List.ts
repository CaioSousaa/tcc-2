import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Board } from "./Board";

@Entity("lists")
@Index("idx_lists_board_position", ["boardId", "position"])
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  // Dense, 0-based position inside the board (plan §3.4). Deliberately not UNIQUE.
  @Column({ type: "int" })
  position!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
