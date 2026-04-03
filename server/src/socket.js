const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let ioInstance = null;

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }

  const header = socket.handshake?.headers?.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
};

const initializeSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true
    }
  });

  ioInstance.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: payload.sub,
        role: payload.role
      };
      return next();
    } catch (_error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }
  });

  return ioInstance;
};

const getIo = () => ioInstance;

module.exports = { initializeSocket, getIo };