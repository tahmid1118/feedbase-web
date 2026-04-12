import { z } from "zod";

const languageSchema = z
  .string()
  .trim()
  .min(2)
  .max(8)
  .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);

const passwordSchema = z.string().min(1, "Password is required.");

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[0-9]/, "Password must include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema,
  lg: languageSchema,
});

const signupBaseSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address."),
  contact: z
    .string()
    .trim()
    .min(7, "Contact number is too short.")
    .max(20, "Contact number is too long.")
    .regex(/^\+?[0-9()\-\s]+$/, "Enter a valid contact number."),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password."),
  lg: languageSchema,
});

export const signupSchema = signupBaseSchema.refine(
  (value) => value.password === value.confirmPassword,
  {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  }
);

export const registerPayloadSchema = signupBaseSchema.omit({
  confirmPassword: true,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
