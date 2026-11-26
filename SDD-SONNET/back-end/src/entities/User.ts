import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  /** Sempre normalizado (minúsculas, sem espaços) antes de gravar (RN-01, RT-29). */
  @Index({ unique: true })
  @Column({ type: "varchar", length: 254 })
  email!: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
