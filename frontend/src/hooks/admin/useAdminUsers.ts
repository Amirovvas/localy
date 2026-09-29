import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import type { AdminUser } from "@/lib/admin";

interface IResponse {
  message: string;
  data: AdminUser[];
}

export const useAdminUsers = (search: string) =>
  useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const res = await api.get<IResponse>("/users", { params: { search: search || undefined } });
      return res.data.data;
    },
  });
