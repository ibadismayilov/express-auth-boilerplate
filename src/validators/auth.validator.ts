import z from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email!").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be minimum 8 characters!")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one digit."),
    username: z.string().min(2, "Username is short").max(30, "Username is too long").optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email!").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});


export const banIpSchema = z.object({
  body: z.object({
    ip: z
      .string()
      .ip({ version: "v4" })
      .or(z.string().ip({ version: "v6" })),
  }),
});

export const unbanIpSchema = z.object({
  body: z.object({
    ip: z
      .string()
      .ip({ version: "v4" })
      .or(z.string().ip({ version: "v6" })),
  }),
});


export const updateUserSchema = z.object({
  body: z.object({
    username: z.string().min(2, "Username is too short").max(30, "Username is too long").optional(),
    email: z.string().email("Please enter a valid email!").optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "Password must be minimum 8 characters!")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one digit."),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email."),
    code: z.string().length(6, "OTP code must consist of exactly 6 symbols!"), 
  }),
});
