import { NextFunction, Request, Response } from "express";
import { apiErrors } from "../utils/apiErrors";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user?.isAdmin) {
    const error = apiErrors.forbidden("Доступ только для администраторов");
    return res.status(error.status).json({ message: error.message });
  }

  next();
};
