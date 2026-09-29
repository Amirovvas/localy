import { NextFunction, Request, Response } from "express";
import { uploadChatImageService } from "../services/upload.service";

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await uploadChatImageService(req.file);
    res.status(201).json({ message: "image uploaded", data: result });
  } catch (error) {
    next(error);
  }
};
