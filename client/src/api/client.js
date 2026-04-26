import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rpcb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  me: () => api.get("/users/me")
};

export const productApi = {
  list: (query) => api.get("/products", { params: query }),
  search: (query) => api.get("/products/search", { params: query }),
  create: (payload) => api.post("/products", payload),
  delete: (productId) => api.delete(`/products/${productId}`),
  myProducts: () => api.get("/products/mine")
};

export const shopApi = {
  nearby: (query) => api.get("/shops/nearby", { params: query }),
  search: (query) => api.get("/shops/search", { params: query }),
  myShops: () => api.get("/shops/mine"),
  create: (payload) => api.post("/shops", payload),
  delete: (shopId) => api.delete(`/shops/${shopId}`),
  geocode: (query) => api.get("/shops/geocode", { params: query }),
  updateLocation: (shopId) => api.patch(`/shops/${shopId}/location`)
};

export const priceApi = {
  list: (query) => api.get("/prices", { params: query }),
  history: (productId, query) => api.get(`/prices/history/${productId}`, { params: query }),
  upsert: (payload) => api.post("/prices", payload)
};

export const chatbotApi = {
  query: (payload) => api.post("/chatbot/query", payload)
};

export const notificationApi = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.patch(`/notifications/${id}/read`)
};

export const userApi = {
  profileInsights: () => api.get("/users/profile-insights"),
  deleteRecentActivity: (activityId) => api.delete(`/users/recent-activity/${activityId}`),
  watchlist: () => api.get("/users/watchlist"),
  addWatch: (payload) => api.post("/users/watchlist", payload),
  removeWatch: (productId) => api.delete(`/users/watchlist/${productId}`)
};

export const subscriptionApi = {
  me: () => api.get("/subscriptions/me"),
  createOrder: (payload) => api.post("/subscriptions/create-order", payload),
  verify: (payload) => api.post("/subscriptions/verify", payload)
};

export default api;
