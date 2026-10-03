import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, (b) => b.lists, { onDelete: "CASCADE" })
  board!: Board;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "int" })
  position!: number;

  @OneToMany(() => Card, (c) => c.list)
  cards!: Card[];
}
