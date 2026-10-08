import { Router } from "express";
import {
  blockReportAuthorController,
  deleteReportController,
  deleteReportedMessageController,
  getReportContextController,
  listReportEventsController,
  listReportsController,
  unblockReportAuthorController,
  updateReportStatusController,
} from "../controllers/report.controller";
import { validateSchema } from "../middleware/schema";
import { updateReportStatusSchema } from "../schemas/report.schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, listReportsController);
router.get("/:id/context", authMiddleware, adminMiddleware, getReportContextController);
router.get("/:id/events", authMiddleware, adminMiddleware, listReportEventsController);
router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateSchema(updateReportStatusSchema),
  updateReportStatusController,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteReportController);
router.post(
  "/:id/delete-message",
  authMiddleware,
  adminMiddleware,
  deleteReportedMessageController,
);
router.post("/:id/block-author", authMiddleware, adminMiddleware, blockReportAuthorController);
router.post(
  "/:id/unblock-author",
  authMiddleware,
  adminMiddleware,
  unblockReportAuthorController,
);

export default router;
