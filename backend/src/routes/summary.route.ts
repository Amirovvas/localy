import { Router } from "express";
import { summarizeChatController } from "../controllers/summary.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// POST /summary/5 — сводка комнаты с id 5
router.post("/:id", authMiddleware, summarizeChatController);

export default router;
