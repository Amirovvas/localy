import { Router } from "express";
import {
  clearMessagesController,
  createMessageController,
  deleteMessageController,
  getMessagesController,
  toggleMessageReactionController,
} from "../controllers/message.controller";
import { validateSchema } from "../middleware/schema";
import { createMessageSchema } from "../schemas/message.schema";
import { toggleReactionSchema } from "../schemas/reaction.schema";
import { createReportSchema } from "../schemas/report.schema";
import { reportMessageController } from "../controllers/report.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getMessagesController);
router.post("/", authMiddleware, validateSchema(createMessageSchema), createMessageController);
router.post("/clear", authMiddleware, clearMessagesController);
router.delete("/:id", authMiddleware, deleteMessageController);
router.post(
  "/:id/reactions",
  authMiddleware,
  validateSchema(toggleReactionSchema),
  toggleMessageReactionController,
);

router.post(
  "/:id/report",
  authMiddleware,
  validateSchema(createReportSchema),
  reportMessageController,
);

export default router;
