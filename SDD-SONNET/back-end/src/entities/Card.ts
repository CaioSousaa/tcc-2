import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { Board } from "./Board";
import { List } from "./List";

@Entity("cards")
@Index(["listId", "position"])
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "list_id", type: "uuid" })
  listId!: string;

  @ManyToOne(() => List, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "list_id" })
  list!: Relation<List>;

  /**
   * Denormalizado: deve ser sempre igual ao quadro da lista (RT-26). Os serviços
   * garantem isso, pois cards só se movem entre listas do mesmo quadro.
   */
  @Index()
  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "board_id" })
  board!: Relation<Board>;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "varchar", length: 5000, nullable: true })
  description!: string | null;

  @Column({ type: "int" })
  position!: number;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  /** Data sem horário nem fuso, trafega como `AAAA-MM-DD` (RT-27). */
  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
