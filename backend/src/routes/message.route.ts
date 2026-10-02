import { Router } from "express";
import {
  clearMessagesController,
  createMessageController,
  deleteMessageController,
  editMessageController,
  getMessagesController,
  getPinnedMessagesController,
  getReadStateController,
  markRoomReadController,
  searchMessagesController,
  toggleMessageReactionController,
  togglePinMessageController,
} from "../controllers/message.controller";
import { validateSchema } from "../middleware/schema";
import { createMessageSchema, editMessageSchema } from "../schemas/message.schema";
import { toggleReactionSchema } from "../schemas/reaction.schema";
import { createReportSchema } from "../schemas/report.schema";
import { reportMessageController } from "../controllers/report.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getMessagesController);
router.get("/pinned", authMiddleware, getPinnedMessagesController);
router.get("/search", authMiddleware, searchMessagesController);
router.get("/read-state", authMiddleware, getReadStateController);
router.post("/", authMiddleware, validateSchema(createMessageSchema), createMessageController);
router.post("/clear", authMiddleware, clearMessagesController);
router.post("/read", authMiddleware, markRoomReadController);
router.patch(
  "/:id",
  authMiddleware,
  validateSchema(editMessageSchema),
  editMessageController,
);
router.delete("/:id", authMiddleware, deleteMessageController);
router.post(
  "/:id/reactions",
  authMiddleware,
  validateSchema(toggleReactionSchema),
  toggleMessageReactionController,
);
router.post("/:id/pin", authMiddleware, togglePinMessageController);

router.post(
  "/:id/report",
  authMiddleware,
  validateSchema(createReportSchema),
  reportMessageController,
);

export default router;
