import { useQuery } from "@tanstack/react-query";
import { api } from "../api/api";
import { useHasToken } from "./useHasToken";

export interface IProfileCommunity {
  id: number;
  name: string;
  category: "university" | "school" | "district" | "residential";
  city: string;
}

interface IProfile {
  id: number;
  name: string;
  email: string;
  city: string;
  avatar: string;
  anon_id: number;
  is_admin: boolean;
  created_at: string;
  communities: IProfileCommunity[];
}

interface IResponse {
  message: string;
  data: IProfile | null;
}

export const useProfile = () => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: ["profile"],
    enabled: hasToken,
    queryFn: async () => {
      const res = await api.get<IResponse>("/auth/profile");
      return res.data.data ?? null;
    },
  });
};
