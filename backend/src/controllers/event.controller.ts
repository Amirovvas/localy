import { NextFunction, Request, Response } from "express";
import {
  createEventService,
  deleteEventService,
  listEventsService,
  updateEventService,
} from "../services/event.service";
import { apiErrors } from "../utils/apiErrors";

export const getEventsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = Number(req.query.communityId);
    if (!communityId) throw apiErrors.badRequest("communityId is required");

    const events = await listEventsService(communityId);
    res.status(200).json({ message: "events", data: events });
  } catch (error) {
    next(error);
  }
};

export const createEventController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const event = await createEventService(req.body, userId);
    res.status(201).json({ message: "event created", data: event });
  } catch (error) {
    next(error);
  }
};

export const updateEventController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const event = await updateEventService(Number(req.params.id), req.body);
    res.status(200).json({ message: "event updated", data: event });
  } catch (error) {
    next(error);
  }
};

export const deleteEventController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteEventService(Number(req.params.id));
    res.status(200).json({ message: "event deleted" });
  } catch (error) {
    next(error);
  }
};
