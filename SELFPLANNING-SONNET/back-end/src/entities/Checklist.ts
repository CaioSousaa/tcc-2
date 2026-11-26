import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Card } from "./Card";
import { ChecklistItem } from "./ChecklistItem";

@Entity("checklists")
export class Checklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, (c) => c.checklists, { onDelete: "CASCADE" })
  card!: Card;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "int" })
  position!: number;

  @OneToMany(() => ChecklistItem, (i) => i.checklist)
  items!: ChecklistItem[];
}
