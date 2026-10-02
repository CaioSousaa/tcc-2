import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
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
  checklist!: Relation<Checklist>;

  @Column({ type: "varchar", length: 200 })
  text!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
