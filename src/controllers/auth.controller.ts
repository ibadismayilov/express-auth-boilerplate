import { catchAsync } from "../utils/catch.async";
import * as AuthService from "../services/auth.service";
import { hashToken } from "../utils/token.util";
import { prisma } from "../lib/prisma";
import { cookieOptions } from "../config/cookie.config";
import { redisClient } from "../lib/redis";
import { getSafeIp } from "../utils/ip.util";
import { UnauthorizedError } from "../errors/custom.error";

export const register = catchAsync(async (req, res) => {
  const ipAddress = getSafeIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";

  const user = await AuthService.registerUser({ ...req.body, ipAddress, userAgent });

  res.status(201).json({
    status: "success",
    message: "Registration successful. Please check your email for the verification code.",
    data: { user },
  });
});

export const login = catchAsync(async (req, res) => {
  const ipAddress = getSafeIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";

  const { accessToken, refreshToken } = await AuthService.loginUser({
    ...req.body,
    ipAddress,
    userAgent,
  });

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(200).json({ status: "success", accessToken });
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.signedCookies.refreshToken;

  if (!token) throw new UnauthorizedError("No refresh token provided");

  const { newAccessToken, newRefreshToken } = await AuthService.refreshUserToken(token);

  res.cookie("refreshToken", newRefreshToken, cookieOptions);

  res.status(200).json({
    status: "success",
    accessToken: newAccessToken,
  });
});

export const logout = catchAsync(async (req, res) => {
  const token = req.signedCookies.refreshToken;

  if (token) {
    const hashedToken = hashToken(token);

    await prisma.refreshToken.deleteMany({
      where: { token: hashedToken },
    });

    const keys = await redisClient.keys(`session:*:${hashedToken}`);

    for (const key of keys) await redisClient.del(key);
  }

  const clearOption = { ...cookieOptions };

  delete (clearOption as Partial<typeof cookieOptions>).maxAge;

  res.clearCookie("refreshToken", clearOption);
  res.status(200).json({ status: "success", message: "Logged out." });
});

export const getMe = catchAsync(async (req, res, _next) => {
  const userId = req.user?.id;

  if (!userId) throw new UnauthorizedError("You are not logged in.");

  const user = await AuthService.getUserById(userId);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

export const verifyOTP = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await AuthService.verifyUserOTP(req.body);

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(200).json({
    status: "success",
    message: "Email verified successfully. Welcome to your account!",
    data: {
      user,
      accessToken,
    },
  });
});
