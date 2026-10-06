import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { List } from "./List";
import { BoardMember } from "./BoardMember";
import { Label } from "./Label";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @ManyToOne(() => User)
  owner: User;

  @OneToMany(() => List, (list) => list.board, { cascade: true })
  lists: List[];

  @OneToMany(() => BoardMember, (member) => member.board, { cascade: true })
  members: BoardMember[];

  @OneToMany(() => Label, (label) => label.board, { cascade: true })
  labels: Label[];

  @CreateDateColumn()
  createdAt: Date;
}
