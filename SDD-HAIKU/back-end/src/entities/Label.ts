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
import { CardLabel } from "./CardLabel";

@Entity("labels")
export class Label {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  boardId!: string;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @Column({ type: "varchar", length: 7 })
  color!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Board, (board) => board.labels)
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label, {
    cascade: true,
  })
  cardLabels!: CardLabel[];
}
