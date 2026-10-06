import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Board } from "./Board";
import { CardLabel } from "./CardLabel";

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "varchar", length: 7, default: "#6200EA" })
  color: string;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: "CASCADE" })
  board: Board;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label, { cascade: true })
  cardLabels: CardLabel[];
}
