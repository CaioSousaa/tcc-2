import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  completed!: boolean;

  @Column()
  checklistId!: string;

  @Column({ type: "integer", default: 0 })
  position!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Checklist, (checklist) => checklist.items)
  @JoinColumn({ name: "checklistId" })
  checklist!: Checklist;
}
