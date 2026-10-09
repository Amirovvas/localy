import { NextFunction, Request, Response } from "express";
import {
  acceptConversationService,
  blockConversationService,
  declineConversationService,
  listConversationsService,
  listDirectMessagesService,
  markConversationReadService,
  sendDirectMessageService,
  startConversationService,
  unblockConversationService,
} from "../services/conversation.service";

type IdRequest = Request<{ id: string }>;

const currentUserId = (req: Request) => (req as any).user.id as number;

export const listConversationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await listConversationsService(currentUserId(req));
    res.status(200).json({ message: "conversations", data });
  } catch (error) {
    next(error);
  }
};

export const startConversationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await startConversationService({ ...req.body, userId: currentUserId(req) });
    res.status(201).json({ message: "conversation started", data });
  } catch (error) {
    next(error);
  }
};

export const listDirectMessagesController = async (req: IdRequest, res: Response, next: NextFunction) => {
  try {
    const data = await listDirectMessagesService(Number(req.params.id), currentUserId(req));
    res.status(200).json({ message: "direct messages", data });
  } catch (error) {
    next(error);
  }
};

export const sendDirectMessageController = async (req: IdRequest, res: Response, next: NextFunction) => {
  try {
    const data = await sendDirectMessageService(
      Number(req.params.id),
      currentUserId(req),
      req.body.text,
      req.body.attachment,
    );
    res.status(201).json({ message: "message sent", data });
  } catch (error) {
    next(error);
  }
};

const actionController =
  (action: (conversationId: number, userId: number) => Promise<void>, message: string) =>
  async (req: IdRequest, res: Response, next: NextFunction) => {
    try {
      await action(Number(req.params.id), currentUserId(req));
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  };

export const acceptConversationController = actionController(acceptConversationService, "accepted");
export const declineConversationController = actionController(declineConversationService, "declined");
export const blockConversationController = actionController(blockConversationService, "blocked");
export const unblockConversationController = actionController(unblockConversationService, "unblocked");
export const markConversationReadController = actionController(markConversationReadService, "read");
