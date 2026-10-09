import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { access_secret } from "../utils/generateTokens";
import { getUserAccess } from "../utils/userCache";

let io: Server | null = null;

export const roomChannel = (roomId: number | string) => `room:${roomId}`;

export const userChannel = (userId: number | string) => `user:${userId}`;

export const getIO = () => io;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL!,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error("unauthorized");

      const decoded = jwt.verify(token, access_secret) as { id: number };
      const access = await getUserAccess(decoded.id);
      if (!access.exists || access.isBlocked) throw new Error("unauthorized");

      socket.data.user = decoded;
      socket.data.anonId = access.anonId;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userChannel(socket.data.user.id));

    socket.on("typing", (payload: { roomId?: number; isTyping?: boolean }) => {
      if (!payload || !payload.roomId) return;

      const channel = roomChannel(payload.roomId);
      if (!socket.rooms.has(channel)) return;

      socket.to(channel).emit("typing", {
        roomId: payload.roomId,
        anon_id: socket.data.anonId,
        isTyping: Boolean(payload.isTyping),
      });
    });

    socket.on("room:join", (roomId: number) => {
      if (!roomId) return;
      socket.join(roomChannel(roomId));
    });

    socket.on("room:leave", (roomId: number) => {
      if (!roomId) return;
      socket.leave(roomChannel(roomId));
    });
  });

  return io;
};
