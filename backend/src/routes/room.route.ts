import { Router } from "express";
import {
  createRoomController,
  deleteRoomController,
  getRoomsController,
  updateRoomController,
} from "../controllers/room.controller";
import { validateSchema } from "../middleware/schema";
import { createRoomSchema, updateRoomSchema } from "../schemas/room.schema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getRoomsController);
router.post("/", authMiddleware, validateSchema(createRoomSchema), createRoomController);
router.put("/:id", authMiddleware, validateSchema(updateRoomSchema), updateRoomController);
router.delete("/:id", authMiddleware, deleteRoomController);

export default router;
