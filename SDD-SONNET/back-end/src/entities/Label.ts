import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from "typeorm";
import { LABEL_COLORS, type LabelColor } from "../shared/validation";
import { Board } from "./Board";

/** Nome único por quadro sem diferenciar maiúsculas, via `name_key` (RN-26, RT-30). */
@Entity("labels")
@Unique(["boardId", "nameKey"])
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @Column({ type: "varchar", length: 30 })
  name!: string;

  @Column({ name: "name_key", type: "varchar", length: 30 })
  nameKey!: string;

  @Column({ type: "enum", enum: [...LABEL_COLORS], enumName: "label_color" })
  color!: LabelColor;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
