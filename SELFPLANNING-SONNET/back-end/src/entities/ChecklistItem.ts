import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  checklistId!: string;

  @ManyToOne(() => Checklist, (c) => c.items, { onDelete: "CASCADE" })
  checklist!: Checklist;

  @Column({ type: "varchar" })
  text!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  @Column({ type: "int" })
  position!: number;
}
