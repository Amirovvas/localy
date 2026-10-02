import { Router } from "express";
import {
  loginController,
  logoutController,
  profileController,
  refreshController,
  registerController,
  updateProfileController,
} from "../controllers/auth.controller";
import { validateSchema } from "../middleware/schema";
import { loginSchema, registerSchema, updateProfileSchema } from "../schemas/auth.schema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerController);
router.post("/login", validateSchema(loginSchema), loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/profile", authMiddleware, profileController);
router.patch("/profile", authMiddleware, validateSchema(updateProfileSchema), updateProfileController);

export default router;
