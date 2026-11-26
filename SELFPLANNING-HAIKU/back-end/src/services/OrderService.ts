import { AppDataSource } from "../database";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { CartService } from "./CartService";

const orderRepository = AppDataSource.getRepository(Order);
const orderItemRepository = AppDataSource.getRepository(OrderItem);

export class OrderService {
  static calculateShipping(zipCode: string): number {
    // Simplified shipping calculation based on zip code
    // In production, integrate with real shipping API
    const baseShipping = 10;
    const zipPrefix = parseInt(zipCode.substring(0, 5)) || 0;
    const additionalShipping = (zipPrefix % 100) * 0.01;
    return parseFloat((baseShipping + additionalShipping).toFixed(2));
  }

  static async checkout(userId: string, address: string, zipCode: string) {
    const cartData = await CartService.getCart(userId);

    if (cartData.items.length === 0) {
      throw new Error("Cart is empty");
    }

    if (!address || !zipCode) {
      throw new Error("Address and zip code are required");
    }

    const shipping = this.calculateShipping(zipCode);
    const subtotal = cartData.total;
    const total = parseFloat((subtotal + shipping).toFixed(2));

    // Create order
    const order = orderRepository.create({
      user: { id: userId },
      subtotal,
      shipping,
      total,
      address,
      zipCode,
      status: "pending",
    });

    const savedOrder = await orderRepository.save(order);

    // Create order items
    for (const cartItem of cartData.items) {
      const orderItem = orderItemRepository.create({
        order: savedOrder,
        product: { id: cartItem.product.id },
        quantity: cartItem.quantity,
        price: cartItem.product.price,
      });

      await orderItemRepository.save(orderItem);
    }

    // Clear cart
    await CartService.clearCart(userId);

    return this.getOrder(savedOrder.id);
  }

  static async getOrder(orderId: string) {
    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true } },
    });

    if (!order) throw new Error("Order not found");

    return {
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      address: order.address,
      zipCode: order.zipCode,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
        },
        quantity: item.quantity,
        subtotal: parseFloat(item.price.toString()) * item.quantity,
      })),
    };
  }

  static async getUserOrders(userId: string, startDate?: Date, endDate?: Date) {
    const query = orderRepository
      .createQueryBuilder("order")
      .where("order.userId = :userId", { userId })
      .orderBy("order.createdAt", "DESC");

    if (startDate) {
      query.andWhere("order.createdAt >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("order.createdAt <= :endDate", { endDate });
    }

    const orders = await query.getMany();

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    }));
  }
}
