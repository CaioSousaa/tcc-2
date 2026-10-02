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

  @Column({ type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.checklists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Relation<Card>;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "int", default: 0 })
  position!: number;

  @OneToMany(() => ChecklistItem, (item) => item.checklist)
  items!: Relation<ChecklistItem[]>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
