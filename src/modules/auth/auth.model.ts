import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { type IUser } from "./auth.interface.ts";

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
  },
  { timestamps: true },
);

// 🔐 Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model<IUser>("User", userSchema);
