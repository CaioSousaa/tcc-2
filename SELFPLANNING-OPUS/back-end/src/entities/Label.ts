import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { Board } from "./Board";

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 40 })
  name!: string;

  @Column({ length: 7 })
  color!: string;

  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
