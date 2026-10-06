import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Card } from "./Card";
import { ChecklistItem } from "./ChecklistItem";

@Entity("checklists")
export class Checklist {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @ManyToOne(() => Card, (card) => card.checklists, { onDelete: "CASCADE" })
  card: Card;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, { cascade: true })
  items: ChecklistItem[];
}
