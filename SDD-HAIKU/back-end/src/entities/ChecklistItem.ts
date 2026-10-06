import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  checklistId!: string;

  @Column({ type: "varchar", length: 255 })
  text!: string;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Column({ type: "integer" })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Checklist, (checklist) => checklist.items)
  @JoinColumn({ name: "checklistId" })
  checklist!: Checklist;
}
