import { NextFunction, Request, Response } from "express";
import { summarizeChatService } from "../services/summary.service";

export const summarizeChatController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const result = await summarizeChatService(Number(req.params.id), userId);
    res.status(200).json({ message: "summary", data: result });
  } catch (error) {
    next(error);
  }
};
