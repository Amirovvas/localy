import { NextFunction, Request, Response } from "express";
import { deleteUserService, getUserService, listUsersService } from "../services/auth.service";

export const listUsersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const users = await listUsersService(search || undefined);
    res.status(200).json({ message: "users", data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await getUserService(Number(req.params.id));
    res.status(200).json({ message: "user", data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteUserService(Number(req.params.id));
    res.status(200).json({ message: "user deleted" });
  } catch (error) {
    next(error);
  }
};
