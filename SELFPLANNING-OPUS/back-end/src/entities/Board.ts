import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { BoardMember } from "./BoardMember";
import { BoardList } from "./BoardList";
import { Label } from "./Label";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 7, default: "#1D3557" })
  color!: string;

  @OneToMany(() => BoardMember, (member) => member.board)
  members!: Relation<BoardMember[]>;

  @OneToMany(() => BoardList, (list) => list.board)
  lists!: Relation<BoardList[]>;

  @OneToMany(() => Label, (label) => label.board)
  labels!: Relation<Label[]>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
