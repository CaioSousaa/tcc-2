import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class List {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "integer", default: 0 })
  position: number;

  @ManyToOne(() => Board, (board) => board.lists, { onDelete: "CASCADE" })
  board: Board;

  @OneToMany(() => Card, (card) => card.list, { cascade: true })
  cards: Card[];
}
