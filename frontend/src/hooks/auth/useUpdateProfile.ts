import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes: { name?: string; allowDm?: boolean }) => {
      const res = await api.patch("/auth/profile", changes);
      return res.data.data as { id: number; name: string; allow_dm: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
