import {
  Column,
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

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Relation<Board>;

  @Column({ type: "varchar", length: 50, default: "" })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  color!: string;
}
