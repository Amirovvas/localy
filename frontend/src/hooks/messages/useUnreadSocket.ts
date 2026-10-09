import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useHasToken } from "../auth/useHasToken";

export const useUnreadSocket = () => {
  const queryClient = useQueryClient();
  const hasToken = useHasToken();

  useEffect(() => {
    if (!hasToken) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleUnread = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", "unread"] });
      }, 400);
    };

    socket.on("room:unread", handleUnread);
    return () => {
      clearTimeout(timer);
      socket.off("room:unread", handleUnread);
    };
  }, [hasToken, queryClient]);
};
