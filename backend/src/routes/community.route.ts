import { Router } from "express";
import {
  createCommunityController,
  deleteCommunityController,
  discoverCommunitiesController,
  joinCommunityController,
  leaveCommunityController,
  getCommunitiesController,
  getCommunityController,
  getMyCommunitiesController,
  listAdminCommunitiesController,
  updateCommunityController,
} from "../controllers/community.controller";
import { validateSchema } from "../middleware/schema";
import { createCommunitySchema, updateCommunitySchema } from "../schemas/community.schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// /mine, /discover, /admin обязаны идти раньше /:id, иначе express примет их за id
router.get("/mine", authMiddleware, getMyCommunitiesController);
router.get("/discover", authMiddleware, discoverCommunitiesController);
router.get("/admin", authMiddleware, adminMiddleware, listAdminCommunitiesController);
router.get("/", getCommunitiesController);
router.get("/:id", authMiddleware, getCommunityController);
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateSchema(createCommunitySchema),
  createCommunityController,
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateSchema(updateCommunitySchema),
  updateCommunityController,
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCommunityController);
router.post("/:id/join", authMiddleware, joinCommunityController);
router.delete("/:id/leave", authMiddleware, leaveCommunityController);

export default router;
