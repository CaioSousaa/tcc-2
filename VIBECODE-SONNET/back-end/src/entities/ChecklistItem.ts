import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  content!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  @Column({ type: "int", default: 0 })
  position!: number;

  @Column({ type: "uuid" })
  checklistId!: string;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "checklistId" })
  checklist!: Checklist;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
