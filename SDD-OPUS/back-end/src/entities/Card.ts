import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "./Board";
import { List } from "./List";

@Entity("cards")
@Index("idx_cards_list_position", ["listId", "position"])
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "list_id", type: "uuid" })
  listId!: string;

  @ManyToOne(() => List, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "list_id" })
  list!: List;

  // Redundant with list.board_id on purpose (plan §3.2): authorization and board loading
  // need no join. Set at creation and never changed (R-12).
  @Index()
  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "varchar", length: 5000, nullable: true })
  description!: string | null;

  @Column({ type: "int" })
  position!: number;

  // Date only, "YYYY-MM-DD" (RN-D3).
  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate!: string | null;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
