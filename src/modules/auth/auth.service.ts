import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./auth.model.ts";
import { type IUser, type ILogin } from "./auth.interface.ts";
import { createPasswordResetToken } from "../../utils/generate-token.ts";
import crypto from "crypto";
import { generateOTP, hashOTP } from "../../utils/create-otp.ts";
import { sendEmail } from "../../utils/send-mail.ts";

const checkOTPRateLimit = async (email: string): Promise<boolean> => {
  const user = await User.findOne({ email: email });
  if (!user) return true;

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  if (!user.lastOtpRequestTime || user.lastOtpRequestTime < oneMinuteAgo) {
    user.otpRequestCount = 0;
    user.lastOtpRequestTime = now;
    await user.save({ validateBeforeSave: false });
    return true;
  }

  if (user.otpRequestCount! >= 3) {
    throw new Error("Too many OTP requests. Please try again after 1 minute.");
  }

  user.otpRequestCount = (user.otpRequestCount || 0) + 1;
  user.lastOtpRequestTime = now;
  await user.save({ validateBeforeSave: false });
  return true;
};

export const trackDeviceSession = async (
  userId: string,
  ip: string,
  userAgent: string,
): Promise<string> => {
  const sessionToken = crypto.randomBytes(32).toString("hex");

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.deviceSessions) {
    user.deviceSessions = [];
  }

  user.deviceSessions.push({
    sessionToken,
    ip,
    userAgent,
    lastActive: new Date(),
    createdAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });
  return sessionToken;
};

const invalidateAllSessions = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.deviceSessions = [];
  await user.save({ validateBeforeSave: false });
};
export const registerUser = async (payload: IUser) => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const user = await User.create(payload);
  return user;
};

export const loginUser = async (
  payload: ILogin,
  ip?: string,
  userAgent?: string,
) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const isMatch = await bcrypt.compare(payload.password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  let sessionToken = "";
  if (ip && userAgent) {
    sessionToken = await trackDeviceSession(user._id.toString(), ip, userAgent);
  }

  return { user, token, sessionToken };
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateProfile = async (
  userId: string,
  payload: {
    name?: string;
    email?: string;
    avatar?: string;
    bio?: string;
  },
) => {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updatePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  return true;
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    return true; // Don't reveal user existence
  }
  const { resetToken, hashedToken } = createPasswordResetToken();
  user.resetToken = hashedToken;
  user.resetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  return resetToken;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetToken: hashedToken,
    resetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error("Token is invalid or expired");
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetExpires = undefined;

  await invalidateAllSessions(user._id.toString());

  await user.save();

  return true;
};

export const sendOTP = async (email: string) => {
  if (typeof email !== "string") {
    console.error(
      "CRITICAL: checkOTPRateLimit received a non-string value:",
      email,
    );
    throw new Error("Internal Server Error: Invalid email format");
  }
  await checkOTPRateLimit(email);
  const user = await User.findOne({ email: email });
  if (!user) return true; // Stealth return

  const otp = generateOTP();
  user.otp = hashOTP(otp);
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  user.otpAttempts = 0;
  user.otpRequestCount = (user.otpRequestCount || 0) + 1;
  user.lastOtpRequestTime = new Date();
  await user.save({ validateBeforeSave: false });
  await sendEmail(email, "Your OTP Code", `<h2>Your OTP is: ${otp}</h2>`);
  return true;
};

export const verifyOTP = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const user = await User.findOne({ email });

  if (!user || !user.otp) {
    throw new Error("Invalid request");
  }

  if (user.otpExpires! < new Date()) {
    throw new Error("OTP expired");
  }

  if (user.otpAttempts! >= 5) {
    throw new Error("Too many attempts. Try again later.");
  }

  const hashedOtp = hashOTP(otp);

  if (hashedOtp !== user.otp) {
    user.otpAttempts! += 1;
    await user.save({ validateBeforeSave: false });
    throw new Error("Invalid OTP");
  }
  user.password = newPassword;
  user.tokenVersion! += 1;

  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await invalidateAllSessions(user._id.toString());
  await user.save();

  return true;
};
