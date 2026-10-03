import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, (b) => b.labels, { onDelete: "CASCADE" })
  board!: Board;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", length: 7 })
  color!: string;

  @ManyToMany(() => Card, (c) => c.labels)
  cards!: Card[];
}
