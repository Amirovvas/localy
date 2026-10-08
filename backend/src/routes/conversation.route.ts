import { Router } from "express";
import {
  acceptConversationController,
  blockConversationController,
  declineConversationController,
  listConversationsController,
  listDirectMessagesController,
  markConversationReadController,
  sendDirectMessageController,
  startConversationController,
  unblockConversationController,
} from "../controllers/conversation.controller";
import { validateSchema } from "../middleware/schema";
import { sendDirectMessageSchema, startConversationSchema } from "../schemas/conversation.schema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, listConversationsController);
router.post("/", authMiddleware, validateSchema(startConversationSchema), startConversationController);
router.get("/:id/messages", authMiddleware, listDirectMessagesController);
router.post(
  "/:id/messages",
  authMiddleware,
  validateSchema(sendDirectMessageSchema),
  sendDirectMessageController,
);
router.post("/:id/accept", authMiddleware, acceptConversationController);
router.post("/:id/decline", authMiddleware, declineConversationController);
router.post("/:id/block", authMiddleware, blockConversationController);
router.post("/:id/unblock", authMiddleware, unblockConversationController);
router.post("/:id/read", authMiddleware, markConversationReadController);

export default router;
