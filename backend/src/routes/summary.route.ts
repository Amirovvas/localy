import { Router } from "express";
import { summarizeChatController } from "../controllers/summary.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/:id", authMiddleware, summarizeChatController);

export default router;
