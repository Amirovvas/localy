import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { access_secret } from "../utils/generateTokens";
import { pool } from "./pg";

let io: Server | null = null;

export const roomChannel = (roomId: number | string) => `room:${roomId}`;

// message.service.ts и другие сервисы дёргают getIO()?.to(...).emit(...) —
// getIO() возвращает null, пока initSocket ещё не вызван (например, в тестах)
export const getIO = () => io;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL!,
      credentials: true,
    },
  });

  // тот же access-токен, что и в authMiddleware для REST — сокет открывается
  // уже залогиненным пользователем, отдельного логина через сокет нет
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error("unauthorized");

      const decoded = jwt.verify(token, access_secret) as { id: number };
      // anon_id нужен для индикатора "печатает" — другим участникам
      // показывается только он, никогда имя или почта
      const result = await pool.query(`select anon_id, is_blocked from users where id = $1`, [
        decoded.id,
      ]);
      if (!result.rows[0] || result.rows[0].is_blocked) throw new Error("unauthorized");

      socket.data.user = decoded;
      socket.data.anonId = result.rows[0].anon_id;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // "печатает": пересылаем остальным участникам той же комнаты.
    // Отправлять можно только в комнату, в которой сокет реально состоит
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
