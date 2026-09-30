import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { mapMessage, type RawMessage } from "./useGetMessages";
import { mergeReactionCounts, type ChatMessage } from "@/lib/chat";

// подписка на живые сообщения текущей комнаты: заходит в room:{roomId} на
// сервере и складывает пришедшие сообщения в кэш useGetMessages той же комнаты
export const useRoomSocket = (roomId: number | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (roomId === null) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit("room:join", roomId);

    const handleNewMessage = (raw: RawMessage & { room_id: number }) => {
      if (raw.room_id !== roomId) return;

      const message = mapMessage(raw);
      queryClient.setQueryData<ChatMessage[]>(["messages", roomId], (prev) => {
        if (!prev) return [message];
        // своё же сообщение уже добавлено оптимистично в useSendMessage —
        // без проверки на id оно продублировалось бы
        if (prev.some((existing) => existing.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const handleEditedMessage = (raw: RawMessage & { room_id: number }) => {
      if (raw.room_id !== roomId) return;

      const message = mapMessage(raw);
      queryClient.setQueryData<ChatMessage[]>(["messages", roomId], (prev) =>
        prev?.map((existing) => (existing.id === message.id ? message : existing)),
      );
    };

    // закрепление/открепление меняет и само сообщение (флаг isPinned), и
    // список закреплённых — второй проще перезапросить, чем вручную
    // пересобирать на клиенте
    const handlePinUpdate = (raw: RawMessage & { room_id: number }) => {
      if (raw.room_id !== roomId) return;

      const message = mapMessage(raw);
      queryClient.setQueryData<ChatMessage[]>(["messages", roomId], (prev) =>
        prev?.map((existing) => (existing.id === message.id ? message : existing)),
      );
      queryClient.invalidateQueries({ queryKey: ["messages", "pinned", roomId] });
    };

    const handleReactionUpdate = (payload: {
      room_id: number;
      message_id: number;
      reactions: { emoji: string; count: number }[];
    }) => {
      if (payload.room_id !== roomId) return;

      queryClient.setQueryData<ChatMessage[]>(["messages", roomId], (prev) =>
        prev?.map((message) =>
          message.id === payload.message_id
            ? { ...message, reactions: mergeReactionCounts(message.reactions, payload.reactions) }
            : message,
        ),
      );
    };

    // сообщение удалил кто-то (сам автор из другой вкладки, или сейчас) — у
    // остальных участников комнаты оно должно пропасть без перезагрузки
    const handleDeletedMessage = (payload: { room_id: number; id: number }) => {
      if (payload.room_id !== roomId) return;

      queryClient.setQueryData<ChatMessage[]>(["messages", roomId], (prev) =>
        prev?.filter((message) => message.id !== payload.id),
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleEditedMessage);
    socket.on("message:pin", handlePinUpdate);
    socket.on("reaction:update", handleReactionUpdate);
    socket.on("message:deleted", handleDeletedMessage);

    return () => {
      socket.emit("room:leave", roomId);
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleEditedMessage);
      socket.off("message:pin", handlePinUpdate);
      socket.off("reaction:update", handleReactionUpdate);
      socket.off("message:deleted", handleDeletedMessage);
    };
  }, [roomId, queryClient]);
};
