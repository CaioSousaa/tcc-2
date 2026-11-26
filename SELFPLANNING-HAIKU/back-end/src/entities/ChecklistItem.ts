import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "boolean", default: false })
  completed: boolean;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, { onDelete: "CASCADE" })
  checklist: Checklist;
}
