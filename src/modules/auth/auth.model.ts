import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { type IUser, type IDeviceSession } from "./auth.interface.ts";

const deviceSessionSchema = new Schema<IDeviceSession>(
  {
    sessionToken: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);


const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "writer"],
      default: "writer",
    },
    bio: String,
    avatar: String,
    resetToken: String,
    resetExpires: Date,
    otp: String,
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    otpRequestCount: { type: Number, default: 0 },
    lastOtpRequestTime: Date,
    deviceSessions: [deviceSessionSchema],
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model<IUser>("User", userSchema);
