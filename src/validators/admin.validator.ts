import z from "zod";

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

export const banUserSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }),
    ttl: z.number().optional(),
  }),
});

export const unbanUserSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }),
  }),
});

export const deleteUserSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: "User ID is required to delete",
    }),
  }),
});
