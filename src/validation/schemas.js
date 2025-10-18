import z from "zod";

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Need an uppercase letter")
    .regex(/[a-z]/, "Need a lowercase letter")
    .regex(/[0-9]/, "Need a number"),
  name: z.string().trim().min(1).max(100),
  role: z.enum(["employee", "admin", "accountant"]).default("employee"),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});