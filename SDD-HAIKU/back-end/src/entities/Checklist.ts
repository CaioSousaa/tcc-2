import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Card } from "./Card";
import { ChecklistItem } from "./ChecklistItem";

@Entity("checklists")
export class Checklist {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  cardId!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Card, (card) => card.checklists)
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, {
    cascade: true,
  })
  items!: ChecklistItem[];
}
