import { NextFunction, Request, Response } from "express";
import {
  createMessageService,
  deleteMessageService,
  listMessagesService,
} from "../services/message.service";
import { toggleMessageReactionService } from "../services/reaction.service";
import { apiErrors } from "../utils/apiErrors";

export const getMessagesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const roomId = Number(req.query.roomId);
    if (!roomId) throw apiErrors.badRequest("roomId is required");

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = typeof req.query.before === "string" ? req.query.before : undefined;

    const messages = await listMessagesService(roomId, userId, limit, before);
    res.status(200).json({ message: "messages", data: messages });
  } catch (error) {
    next(error);
  }
};

export const createMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const message = await createMessageService({ ...req.body, userId });
    res.status(201).json({ message: "message sent", data: message });
  } catch (error) {
    next(error);
  }
};

export const deleteMessageController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    await deleteMessageService(Number(req.params.id), userId);
    res.status(200).json({ message: "message deleted" });
  } catch (error) {
    next(error);
  }
};

export const toggleMessageReactionController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const result = await toggleMessageReactionService(Number(req.params.id), userId, req.body.emoji);
    res.status(200).json({ message: "reaction toggled", data: result });
  } catch (error) {
    next(error);
  }
};
