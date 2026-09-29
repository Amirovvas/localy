import { NextFunction, Request, Response } from "express";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

// ставится ПОСЛЕ authMiddleware — использует req.user.id, который тот кладёт
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const result = await pool.query(`select is_admin from users where id = $1`, [userId]);

    if (!result.rows[0]?.is_admin) {
      const error = apiErrors.forbidden("Доступ только для администраторов");
      return res.status(error.status).json({ message: error.message });
    }

    next();
  } catch (error) {
    next(error);
  }
};
