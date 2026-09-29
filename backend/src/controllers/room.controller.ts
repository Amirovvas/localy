import { NextFunction, Request, Response } from "express";
import {
  createRoomService,
  deleteRoomService,
  listRoomsService,
  updateRoomService,
} from "../services/room.service";
import { apiErrors } from "../utils/apiErrors";

export const getRoomsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = Number(req.query.communityId);
    if (!communityId) throw apiErrors.badRequest("communityId is required");

    const rooms = await listRoomsService(communityId);
    res.status(200).json({ message: "rooms", data: rooms });
  } catch (error) {
    next(error);
  }
};

export const createRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await createRoomService(req.body);
    res.status(201).json({ message: "room created", data: room });
  } catch (error) {
    next(error);
  }
};

export const updateRoomController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const room = await updateRoomService(Number(req.params.id), req.body);
    res.status(200).json({ message: "room updated", data: room });
  } catch (error) {
    next(error);
  }
};

export const deleteRoomController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteRoomService(Number(req.params.id));
    res.status(200).json({ message: "room deleted" });
  } catch (error) {
    next(error);
  }
};
