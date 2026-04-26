import { io } from "socket.io-client";

const getSocketUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api\/?$/, "");
};

export const createSocketConnection = (token) =>
  io(getSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"]
  });
