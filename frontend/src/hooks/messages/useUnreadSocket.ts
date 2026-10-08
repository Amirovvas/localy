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

    const handleUnread = () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "unread"] });
    };

    socket.on("room:unread", handleUnread);
    return () => {
      socket.off("room:unread", handleUnread);
    };
  }, [hasToken, queryClient]);
};
