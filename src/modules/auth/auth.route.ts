import { Router } from "express";
import {
  register,
  login,
  updateProfile,
  updatePassword,
  resetPassword,
  forgotPassword,
  verifyOtp,
  sendOtp,
  getProfile,
} from "./auth.controller.ts";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/update-password", authMiddleware, updatePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
export default router;
