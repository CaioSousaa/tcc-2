import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BoardMember } from "./BoardMember";
import { List } from "./List";
import { Label } from "./Label";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => BoardMember, (m) => m.board)
  members!: BoardMember[];

  @OneToMany(() => List, (l) => l.board)
  lists!: List[];

  @OneToMany(() => Label, (l) => l.board)
  labels!: Label[];
}
