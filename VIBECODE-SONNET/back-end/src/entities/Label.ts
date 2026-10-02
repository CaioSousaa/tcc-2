import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 60, default: "" })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  color!: string;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @ManyToMany(() => Card, (card) => card.labels)
  cards!: Card[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
