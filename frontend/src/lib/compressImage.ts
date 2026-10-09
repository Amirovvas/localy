export class ImageTooLargeError extends Error {}

export const MAX_ORIGINAL_SIZE = 25 * 1024 * 1024;

const MAX_SIDE = 1600;
const QUALITY = 0.85;
const KEEP_AS_IS_BELOW = 400 * 1024;

const loadBitmap = async (file: File): Promise<ImageBitmap> => {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
};

export const compressImage = async (file: File): Promise<File> => {
  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.type === "image/jpeg" && file.size <= KEEP_AS_IS_BELOW) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) return file;
    if (scale === 1 && file.type === "image/jpeg" && blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
};
