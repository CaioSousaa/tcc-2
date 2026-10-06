import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "checklist_id", type: "uuid" })
  checklistId!: string;

  @ManyToOne(() => Checklist, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "checklist_id" })
  checklist!: Checklist;

  @Column({ type: "varchar", length: 200 })
  text!: string;

  @Column({ type: "boolean", default: false })
  checked!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
