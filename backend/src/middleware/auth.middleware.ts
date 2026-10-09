import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { access_secret } from "../utils/generateTokens";
import { apiErrors } from "../utils/apiErrors";
import { getUserAccess } from "../utils/userCache";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    let token = authHeader?.split(" ")[1];
    if (!token) throw apiErrors.unauthorized("no token");
    let decoded = jwt.verify(token, access_secret) as { id: number };
    (req as any).user = decoded;

    const access = await getUserAccess(decoded.id);
    if (access.isBlocked) {
      return res.status(403).json({ message: "Аккаунт заблокирован" });
    }
    (req as any).user.isAdmin = access.isAdmin;

    next();
  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
};
