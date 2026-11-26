import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Board } from "./Board";
import { User } from "./User";
import { BoardRole } from "./BoardMember";

@Entity("invites")
export class Invite {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  boardId!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({
    type: "enum",
    enum: BoardRole,
  })
  role!: BoardRole;

  @Column({ type: "varchar", length: 500, unique: true })
  token!: string;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @Column({ type: "uuid" })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  acceptedAt!: Date | null;

  @ManyToOne(() => Board)
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdBy" })
  creator!: User;
}
