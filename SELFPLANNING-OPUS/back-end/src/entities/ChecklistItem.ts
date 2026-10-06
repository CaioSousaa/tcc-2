import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ length: 300 })
  content!: string;

  @Column({ default: false })
  done!: boolean;

  @Column({ type: "int" })
  position!: number;

  @Column({ name: "checklist_id" })
  checklistId!: string;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "checklist_id" })
  checklist!: Relation<Checklist>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
