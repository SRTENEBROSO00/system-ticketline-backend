import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (server: HttpServer) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  io = new Server(server, {
    cors: {
      origin: frontendUrl,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✔ Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("✖ Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized.");
  }
  return io;
};