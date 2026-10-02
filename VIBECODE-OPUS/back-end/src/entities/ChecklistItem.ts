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

  @Column({ type: "uuid" })
  checklistId!: string;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "checklistId" })
  checklist!: Relation<Checklist>;

  @Column({ type: "varchar", length: 255 })
  text!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  @Column({ type: "int", default: 0 })
  position!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
