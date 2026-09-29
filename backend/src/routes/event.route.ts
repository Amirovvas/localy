import { Router } from "express";
import {
  createEventController,
  deleteEventController,
  getEventsController,
  updateEventController,
} from "../controllers/event.controller";
import { validateSchema } from "../middleware/schema";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getEventsController);
router.post("/", authMiddleware, validateSchema(createEventSchema), createEventController);
router.put("/:id", authMiddleware, validateSchema(updateEventSchema), updateEventController);
router.delete("/:id", authMiddleware, deleteEventController);

export default router;
