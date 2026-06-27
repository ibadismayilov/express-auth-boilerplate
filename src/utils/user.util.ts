import { User } from "@prisma/client";
import { UAParser } from "ua-parser-js";

export type SafeUser = Pick<User, "id" | "email" | "username" | "role" | "createdAt">;

export const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const toSafeUser = (user: SafeUser) => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
};

export const getUserAgentString = (userAgent: string) => {
  const uaResult = new UAParser(userAgent).getResult();

  return `${uaResult.browser.name || "Unknown Browser"} (${uaResult.os.name || "Unknown OS"})`;
};