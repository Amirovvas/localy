import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";
import { compressImage, ImageTooLargeError } from "@/lib/compressImage";

interface IResponse {
  message: string;
  data: { url: string };
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const useUploadImage = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const prepared = await compressImage(file);
      if (prepared.size > MAX_IMAGE_SIZE) {
        throw new ImageTooLargeError("Не удалось уменьшить фото до 5 МБ, выберите другое");
      }

      const formData = new FormData();
      formData.append("file", prepared);
      const res = await api.post<IResponse>("/uploads/image", formData);
      return res.data.data.url;
    },
  });
