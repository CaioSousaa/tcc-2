import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { Card } from "./Card";
import { ChecklistItem } from "./ChecklistItem";

@Entity("checklists")
export class Checklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: "int" })
  position!: number;

  @Column({ name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.checklists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Relation<Card>;

  @OneToMany(() => ChecklistItem, (item) => item.checklist)
  items!: Relation<ChecklistItem[]>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
