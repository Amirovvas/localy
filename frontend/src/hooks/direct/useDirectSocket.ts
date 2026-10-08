import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useHasToken } from "../auth/useHasToken";
import type { DirectMessage } from "./types";

export const useDirectSocket = () => {
  const queryClient = useQueryClient();
  const hasToken = useHasToken();

  useEffect(() => {
    if (!hasToken) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleMessage = (payload: DirectMessage & { conversationId: number }) => {
      queryClient.setQueryData<DirectMessage[]>(
        ["conversations", payload.conversationId, "messages"],
        (prev) => {
          if (!prev) return prev;
          if (prev.some((existing) => existing.id === payload.id)) return prev;
          return [
            ...prev,
            { id: payload.id, text: payload.text, created_at: payload.created_at, mine: payload.mine },
          ];
        },
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: true });
    };

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("dm:message", handleMessage);
    socket.on("dm:update", handleUpdate);

    return () => {
      socket.off("dm:message", handleMessage);
      socket.off("dm:update", handleUpdate);
    };
  }, [hasToken, queryClient]);
};
