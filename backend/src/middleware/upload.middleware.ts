import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../plugins/storage";
import { apiErrors } from "../utils/apiErrors";

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(apiErrors.badRequest("Разрешены только JPG, PNG и WebP") as unknown as Error);
    }
  },
});

export const uploadImageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  uploader.single("file")(req, res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      return next(
        apiErrors.badRequest(
          error.code === "LIMIT_FILE_SIZE"
            ? "Файл слишком большой (максимум 5 МБ)"
            : "Не удалось загрузить файл",
        ),
      );
    }
    next(error);
  });
};
