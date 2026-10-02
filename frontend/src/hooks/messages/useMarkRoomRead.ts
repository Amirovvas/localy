import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

// отмечает все текущие сообщения комнаты прочитанными — вызывается при
// входе в комнату и при выходе из неё, чтобы маркер не отставал от того,
// что пользователь реально успел увидеть за время, пока был в чате
export const useMarkRoomRead = () =>
  useMutation({
    mutationFn: async (roomId: number) => {
      await api.post("/messages/read", null, { params: { roomId } });
    },
  });
