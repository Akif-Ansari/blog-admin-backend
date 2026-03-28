import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(32),
  role: z.enum(["super_admin", "admin", "writer"]).optional(),
});
