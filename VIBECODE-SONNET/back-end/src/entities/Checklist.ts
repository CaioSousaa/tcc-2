import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./Card";
import { ChecklistItem } from "./ChecklistItem";

@Entity("checklists")
export class Checklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "int", default: 0 })
  position!: number;

  @Column({ type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.checklists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @OneToMany(() => ChecklistItem, (item) => item.checklist)
  items!: ChecklistItem[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
