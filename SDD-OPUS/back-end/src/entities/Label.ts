import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Board } from "./Board";

// RN-S5: label names are unique per board, ignoring case — enforced through `name_key`.
@Entity("labels")
@Unique("uq_labels_board_name_key", ["boardId", "nameKey"])
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Column({ type: "varchar", length: 30 })
  name!: string;

  @Column({ name: "name_key", type: "varchar", length: 30 })
  nameKey!: string;

  // Palette key (shared/palette), never a raw CSS color.
  @Column({ type: "varchar", length: 16 })
  color!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
