import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class BoardList {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: "int" })
  position!: number;

  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.lists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @OneToMany(() => Card, (card) => card.list)
  cards!: Relation<Card[]>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
