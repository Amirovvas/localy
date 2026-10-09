import { NextFunction, Request, Response } from "express";
import {
  clearRoomMessagesService,
  createMessageService,
  deleteMessageService,
  editMessageService,
  forwardMessageService,
  getReadStateService,
  listMessagesService,
  listPinnedMessagesService,
  listUnreadCountsService,
  markRoomReadService,
  searchMessagesService,
  togglePinMessageService,
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

export const getUnreadCountsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const counts = await listUnreadCountsService(userId);
    res.status(200).json({ message: "unread", data: counts });
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

export const forwardMessageController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const message = await forwardMessageService(Number(req.params.id), req.body.roomId, userId);
    res.status(201).json({ message: "message forwarded", data: message });
  } catch (error) {
    next(error);
  }
};

export const editMessageController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const message = await editMessageService(Number(req.params.id), userId, req.body.text);
    res.status(200).json({ message: "message edited", data: message });
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

export const togglePinMessageController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const message = await togglePinMessageService(Number(req.params.id), userId);
    res.status(200).json({ message: "pin toggled", data: message });
  } catch (error) {
    next(error);
  }
};

export const getPinnedMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const roomId = Number(req.query.roomId);
    if (!roomId) throw apiErrors.badRequest("roomId is required");

    const messages = await listPinnedMessagesService(roomId, userId);
    res.status(200).json({ message: "pinned messages", data: messages });
  } catch (error) {
    next(error);
  }
};

export const searchMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const roomId = Number(req.query.roomId);
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!roomId) throw apiErrors.badRequest("roomId is required");
    if (!query) {
      res.status(200).json({ message: "search results", data: [] });
      return;
    }

    const messages = await searchMessagesService(roomId, userId, query);
    res.status(200).json({ message: "search results", data: messages });
  } catch (error) {
    next(error);
  }
};

export const getReadStateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const roomId = Number(req.query.roomId);
    if (!roomId) throw apiErrors.badRequest("roomId is required");

    const lastReadMessageId = await getReadStateService(roomId, userId);
    res.status(200).json({ message: "read state", data: { lastReadMessageId } });
  } catch (error) {
    next(error);
  }
};

export const markRoomReadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const roomId = Number(req.query.roomId);
    if (!roomId) throw apiErrors.badRequest("roomId is required");

    await markRoomReadService(roomId, userId);
    res.status(200).json({ message: "marked as read" });
  } catch (error) {
    next(error);
  }
};

export const clearMessagesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const roomId = Number(req.query.roomId);
    if (!roomId) throw apiErrors.badRequest("roomId is required");

    await clearRoomMessagesService(roomId, userId);
    res.status(200).json({ message: "chat cleared" });
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
