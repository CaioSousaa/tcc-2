import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class List {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  boardId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "integer" })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Board, (board) => board.lists)
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @OneToMany(() => Card, (card) => card.list, { cascade: true })
  cards!: Card[];
}
