import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  // SHA-256 of the session token; the token itself is never stored (plan §5.2).
  @Column({ name: "token_hash", type: "char", length: 64, unique: true })
  tokenHash!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "last_used_at", type: "timestamptz" })
  lastUsedAt!: Date;

  @Index()
  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;
}
