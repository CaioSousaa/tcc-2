import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { OrderItem } from "./OrderItem";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User)
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  address: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  zipCode: string;

  @Column({ type: "varchar", length: 50, default: "pending" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
