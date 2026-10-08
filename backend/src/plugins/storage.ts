import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { apiErrors } from "../utils/apiErrors";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const bucket = () => process.env.SUPABASE_BUCKET || "chat-images";

let client: SupabaseClient | null = null;
let bucketReady: Promise<void> | null = null;

const getClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw apiErrors.unavailable("Загрузка файлов не настроена на сервере");
  }
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
};

const ensureBucket = (supabase: SupabaseClient) => {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await supabase.storage.getBucket(bucket());
      if (data) return;

      const { error } = await supabase.storage.createBucket(bucket(), {
        public: true,
        fileSizeLimit: MAX_IMAGE_SIZE,
        allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
      });
      if (error && !/already exists/i.test(error.message)) throw error;
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }
  return bucketReady;
};

export const uploadImage = async (path: string, body: Buffer, contentType: string) => {
  const supabase = getClient();
  await ensureBucket(supabase);

  const { error } = await supabase.storage
    .from(bucket())
    .upload(path, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw apiErrors.badRequest("Не удалось загрузить файл");

  return supabase.storage.from(bucket()).getPublicUrl(path).data.publicUrl;
};

export const assertOwnAttachment = (attachment?: string) => {
  if (!attachment) return;
  const prefix = publicUrlPrefix();
  if (!prefix || !attachment.startsWith(prefix)) {
    throw apiErrors.badRequest("Недопустимое вложение");
  }
};

export const removeImageByUrl = async (url: string) => {
  try {
    const prefix = publicUrlPrefix();
    if (!prefix || !url.startsWith(prefix)) return;

    const path = decodeURIComponent(url.slice(prefix.length));
    const { error } = await getClient().storage.from(bucket()).remove([path]);
    if (error) console.error("Не удалось удалить файл из Storage:", error.message);
  } catch (error) {
    console.error("Не удалось удалить файл из Storage:", error);
  }
};

export const publicUrlPrefix = () => {
  const url = process.env.SUPABASE_URL;
  return url ? `${url.replace(/\/$/, "")}/storage/v1/object/public/${bucket()}/` : null;
};
