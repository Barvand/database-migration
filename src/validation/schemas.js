import { z } from "zod";

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .regex(/^[^\d]/, "Name cannot start with a number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(24, "Password must be at most 24 characters")
      .regex(/[A-Z]/, "Need an uppercase letter")
      .regex(/[a-z]/, "Need a lowercase letter")
      .regex(/[0-9]/, "Need a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["admin", "accountant", "employee"], {
      errorMap: () => ({ message: "Invalid role selected" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});
