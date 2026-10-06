import { create } from "zustand";
import Cookies from "js-cookie";
import api from "./api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: Cookies.get("token") || null,

  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    Cookies.set("token", token, { expires: 7 });
    set({ token, user });
  },

  register: async (email: string, password: string, name: string) => {
    const res = await api.post("/auth/register", { email, password, name });
    const { token, user } = res.data;
    Cookies.set("token", token, { expires: 7 });
    set({ token, user });
  },

  logout: () => {
    Cookies.remove("token");
    set({ user: null, token: null });
  },

  loadUser: async () => {
    try {
      const res = await api.get("/auth/profile");
      set({ user: res.data });
    } catch {
      Cookies.remove("token");
      set({ user: null, token: null });
    }
  },
}));
