import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { access_secret } from "../utils/generateTokens";
import { apiErrors } from "../utils/apiErrors";
import { pool } from "../plugins/pg";

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

    // заблокированный модератором пользователь теряет доступ сразу, не
    // дожидаясь истечения access-токена (он живёт 15 минут)
    const result = await pool.query(`select is_blocked from users where id = $1`, [decoded.id]);
    if (result.rows[0]?.is_blocked) {
      return res.status(403).json({ message: "Аккаунт заблокирован" });
    }

    next();
  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
};
