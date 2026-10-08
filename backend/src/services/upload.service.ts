import { randomUUID } from "crypto";
import { uploadImage } from "../plugins/storage";
import { apiErrors } from "../utils/apiErrors";

const detectImageType = (buffer: Buffer): { mime: string; ext: string } | null => {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer.length > 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
};

export const uploadChatImageService = async (file?: Express.Multer.File) => {
  if (!file) throw apiErrors.badRequest("Файл не передан");

  const type = detectImageType(file.buffer);
  if (!type) throw apiErrors.badRequest("Файл не является изображением JPG, PNG или WebP");

  const path = `chat/${randomUUID()}.${type.ext}`;
  const url = await uploadImage(path, file.buffer, type.mime);

  return { url };
};
