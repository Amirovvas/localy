import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => cb({ token: localStorage.getItem("accessToken") }),
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
