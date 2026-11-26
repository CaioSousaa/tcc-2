import axios from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

export const apiClient = axios.create({
  baseURL: API_BASE,
});

export const setAuthToken = (token: string) => {
  if (token) {
    apiClient.defaults.headers.common["x-user-id"] = token;
  } else {
    delete apiClient.defaults.headers.common["x-user-id"];
  }
};

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userId");
  }
  return null;
};

export const setUserSession = (userId: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("userId", userId);
    setAuthToken(userId);
  }
};

export const clearUserSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("userId");
    apiClient.defaults.headers.common["x-user-id"] = "";
  }
};
