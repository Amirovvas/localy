import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

interface IResponse {
  message: string;
  data: { url: string };
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// загружает фото в Supabase Storage через backend (POST /uploads/image) и
// возвращает публичный URL, который затем уходит в messages.attachment
export const useUploadImage = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<IResponse>("/uploads/image", formData);
      return res.data.data.url;
    },
  });
