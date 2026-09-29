import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

interface IBody {
  name: string;
  email: string;
  password: string;
  city: string;
  communityIds: number[];
}

export const useRegister = () =>
  useMutation({
    mutationKey: ["register"],
    mutationFn: async (body: IBody) => {
      const response = await api.post("/auth/register", body);
      return response.data;
    },
  });
