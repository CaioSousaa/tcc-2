import { apiClient } from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
  zipCode: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export const cartService = {
  async addProduct(productId: string, quantity: number = 1) {
    const { data } = await apiClient.post("/cart/add", { productId, quantity });
    return data as Cart;
  },

  async getCart() {
    const { data } = await apiClient.get("/cart");
    return data as Cart;
  },

  async removeItem(itemId: string) {
    const { data } = await apiClient.delete(`/cart/remove/${itemId}`);
    return data as Cart;
  },
};

export const orderService = {
  async checkout(address: string, zipCode: string) {
    const { data } = await apiClient.post("/orders/checkout", { address, zipCode });
    return data as Order;
  },

  async getOrder(id: string) {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data as Order;
  },

  async getUserOrders(startDate?: string, endDate?: string) {
    const { data } = await apiClient.get("/orders", {
      params: { startDate, endDate },
    });
    return data as Array<{ id: string; status: string; total: number; createdAt: string }>;
  },
};
