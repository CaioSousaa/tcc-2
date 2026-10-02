import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { Board } from "./Board";

@Entity("lists")
@Index(["boardId", "position"])
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  /** Posição densa a partir de 0 dentro do quadro (RT-09). */
  @Column({ type: "int" })
  position!: number;
}
