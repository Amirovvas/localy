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
    onSettled: () => {
      localStorage.removeItem("accessToken");
      disconnectSocket();
      window.location.href = "/login";
    },
  });
