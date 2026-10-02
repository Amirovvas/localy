import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.patch("/auth/profile", { name });
      return res.data.data as { id: number; name: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
