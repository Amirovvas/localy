import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";
import { disconnectSocket } from "@/lib/socket";

export const useLogout = () =>
  useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      const response = await api.post("/auth/logout");
      return response.data;
    },
    // выходим на клиенте в любом случае — даже если запрос на сервер не
    // прошёл (сеть моргнула, токен уже протух), пользователь не должен
    // застревать в разлогиненном, но всё ещё открытом чате
    onSettled: () => {
      localStorage.removeItem("accessToken");
      disconnectSocket();
      window.location.href = "/login";
    },
  });
