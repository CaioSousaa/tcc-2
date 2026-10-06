import { AppDataSource } from "../database";
import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { User } from "../entities/User";
import { Product } from "../entities/Product";

const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);

export class CartService {
  static async getOrCreateCart(userId: string) {
    let cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: { items: { product: true } },
    });

    if (!cart) {
      const user = await userRepository.findOneBy({ id: userId });
      if (!user) throw new Error("User not found");

      cart = cartRepository.create({ user });
      cart = await cartRepository.save(cart);
    }

    return cart;
  }

  static async addProduct(userId: string, productId: string, quantity: number = 1) {
    const cart = await this.getOrCreateCart(userId);
    const product = await productRepository.findOneBy({ id: productId });

    if (!product) throw new Error("Product not found");

    let cartItem = await cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: productId } },
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem = await cartItemRepository.save(cartItem);
    } else {
      cartItem = cartItemRepository.create({ cart, product, quantity });
      cartItem = await cartItemRepository.save(cartItem);
    }

    return cartItem;
  }

  static async removeItem(cartItemId: string) {
    const cartItem = await cartItemRepository.findOneBy({ id: cartItemId });
    if (!cartItem) throw new Error("Cart item not found");

    await cartItemRepository.remove(cartItem);
  }

  static async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    if (!cart.items) {
      cart.items = [];
    }

    const total = cart.items.reduce((acc, item) => {
      return acc + parseFloat(item.product.price.toString()) * item.quantity;
    }, 0);

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
        },
        quantity: item.quantity,
        subtotal: parseFloat(item.product.price.toString()) * item.quantity,
      })),
      total: parseFloat(total.toFixed(2)),
    };
  }

  static async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await cartItemRepository.delete({ cart: { id: cart.id } });
  }
}
