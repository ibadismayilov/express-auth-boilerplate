import { CookieOptions } from "express";
import { env } from "./environment";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, 
  signed: true,
  path: "/",
};
