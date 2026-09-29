import { Router } from "express";
import { uploadImageController } from "../controllers/upload.controller";
import { uploadImageMiddleware } from "../middleware/upload.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/image", authMiddleware, uploadImageMiddleware, uploadImageController);

export default router;
