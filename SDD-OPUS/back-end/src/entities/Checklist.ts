import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./Card";

// Checklists and items are shown in creation order (CA-CK1): no position column.
@Entity("checklists")
export class Checklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "card_id", type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ type: "varchar", length: 100 })
  title!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
