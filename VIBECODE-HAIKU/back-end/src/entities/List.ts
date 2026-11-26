import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  boardId!: string;

  @Column({ type: "integer", default: 0 })
  position!: number;

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
