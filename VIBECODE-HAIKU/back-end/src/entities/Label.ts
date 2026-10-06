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
import { CardLabel } from "./CardLabel";

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  color!: string;

  @Column()
  boardId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Board, (board) => board.labels)
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label, { cascade: true })
  cardLabels!: CardLabel[];
}
