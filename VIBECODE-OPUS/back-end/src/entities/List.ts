import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.lists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Relation<Board>;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "int", default: 0 })
  position!: number;

  @OneToMany(() => Card, (card) => card.list)
  cards!: Relation<Card[]>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
