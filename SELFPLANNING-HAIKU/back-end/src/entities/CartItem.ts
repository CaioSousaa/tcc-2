import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Cart } from "./Cart";
import { Product } from "./Product";

@Entity("cart_items")
export class CartItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: "CASCADE" })
  cart: Cart;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: "integer", default: 1 })
  quantity: number;
}
