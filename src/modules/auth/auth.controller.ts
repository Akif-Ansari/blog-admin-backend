import { type Request, type Response } from "express";
import * as authService from "./auth.service.ts";
import { sendResponse } from "../../utils/send-response.ts";

interface JwtPayload {
  id: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}
import { sendEmail } from "../../utils/send-mail.ts";

export const register = async (req: Request, res: Response) => {
  try {
    console.log("[DEBUG] Register payload:", req.body);
    const user = await authService.registerUser(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "";
    const userAgent = req.get("user-agent") || "";

    const result = await authService.loginUser(req.body, ip, userAgent);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 401,
      success: false,
      message: error.message,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await authService.getProfile(req.user.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    await authService.updatePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const resetToken = await authService.forgotPassword(req.body.email);
    const resetURL = `${process.env.FRONTEND_URL}/reset-password-form/${resetToken}`;
    await sendEmail(
      req.body.email,
      "Reset your password",
      `<p>Click here: <a href="${resetURL}">Reset Password</a></p>`,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Password reset link sent to email",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await authService.resetPassword(
      req.body.token as string,
      req.body.password,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Password reset successful",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error("Email is required");
    }
    await authService.sendOTP(email);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP sent to email",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    await authService.verifyOTP(
      req.body.email,
      req.body.otp,
      req.body.newPassword,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Password reset successful",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
};