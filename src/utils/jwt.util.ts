import jwt from "jsonwebtoken";
import { env } from "../config/environment.config";

const JWT_SECRET = env.jwt.secret!;
const JWT_REFRESH_SECRET = env.jwt.refreshSecret!;

const JWT_EXPIRES_IN = env.jwt.expiresIn || "15m";
const JWT_REFRESH_EXPIRES_IN = "7d";

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT Secrets not found in .env file!");
}

export const signAccessToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (id: string): string => {
  return jwt.sign({ id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  if (!token || token.trim() === "") {
    throw new Error("Token is empty");
  }

  if (token.split(".").length !== 3) {
    throw new Error("Token malformed structure");
  }

  return jwt.verify(token, JWT_SECRET) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  if (!token || token.trim() === "") {
    throw new Error("Token is empty");
  }

  return jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
};
