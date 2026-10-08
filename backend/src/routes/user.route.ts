import { Router } from "express";
import {
  deleteUserController,
  getUserController,
  listUsersController,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, listUsersController);
router.get("/:id", authMiddleware, adminMiddleware, getUserController);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUserController);

export default router;
