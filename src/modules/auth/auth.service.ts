import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./auth.model.ts";
import { type IUser, type ILogin } from "./auth.interface.ts";

export const registerUser = async (payload: IUser) => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const user = await User.create(payload);
  return user;
};

export const loginUser = async (payload: ILogin) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const isMatch = await bcrypt.compare(payload.password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );
  return { user, token };
};
