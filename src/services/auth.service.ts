import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utils/password.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.util";
import { hashToken } from "../utils/token.util";
import { AUTH_CONFIG } from "../config/auth.config";
import { redisClient } from "../lib/redis";
import { redisKeys } from "../utils/redisKey.util";
import { generateOTP } from "../utils/otp.util";
import { sendUserEmail } from "../lib/resend";
import { getVerificationEmailTemplate } from "../utils/email.templates.util";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../errors/custom.error";
import { UAParser } from "ua-parser-js";
import { toSafeUser } from "../utils/user.util";

export const registerUser = async (
  userData: IRegisterInput & { ipAddress: string; userAgent: string }
) => {
  const { username, email, password, ipAddress, userAgent } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.isVerified === true)
    throw new BadRequestError("This user already exists.");

  const rateKey = redisKeys.emailRateLimit(email);
  const isRateLimited = await redisClient.get(rateKey);

  if (isRateLimited)
    throw new TooManyRequestsError(
      "Too many requests. Please wait 1 minute before requesting a new OTP."
    );

  const uaResult = new UAParser(userAgent).getResult();
  const userAgentString = `${uaResult.browser.name || "Unknown Browser"} (${uaResult.os.name || "Unknown OS"})`;

  const code = generateOTP();
  const hashedPassword = await hashPassword(password);

  let user;

  if (existingUser && existingUser.isVerified === false) {
    user = await prisma.user.update({
      where: { email },
      data: {
        username,
        password: hashedPassword,
        ipAddress: ipAddress,
        userAgent: userAgentString,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        ipAddress: ipAddress,
        userAgent: userAgentString,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  const otpKey = redisKeys.otp(email);

  await redisClient.set(rateKey, "true", {
    EX: 60,
  });

  await redisClient.set(otpKey, code, {
    EX: 300,
  });

  await sendUserEmail({
    userEmail: email,
    subject: "Your Verification Code",
    htmlContent: getVerificationEmailTemplate(username, code),
  });

  return user;
};

export const loginUser = async (
  loginData: ILoginInput & { ipAddress: string; userAgent: string }
) => {
  const { email, password, ipAddress, userAgent } = loginData;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(user.password, password)))
    throw new UnauthorizedError("Email or password is incorrect.");

  if (!user.isVerified) throw new ForbiddenError("Please confirm your email first.");

  const uaResult = new UAParser(userAgent).getResult();
  const userAgentString = `${uaResult.browser.name || "Unknown Browser"} (${uaResult.os.name || "Unknown OS"})`;

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  const hashedRefreshToken = hashToken(refreshToken);

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN),
      ipAddress: ipAddress,
      userAgent: userAgentString,
    },
  });

  await redisClient.setEx(
    redisKeys.session(user.id, hashedRefreshToken),
    Math.floor(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN / 1000),
    JSON.stringify({
      userId: user.id,
      isRevoked: false,
      createdAt: Date.now(),
      ipAddress: ipAddress,
      userAgent: userAgentString,
    })
  );

  return { accessToken, refreshToken, user: toSafeUser(user) };
};

export const revokeAllUserSessions = async (userId: string) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });

  const keys = await redisClient.keys(`session:${userId}:*`);

  for (const key of keys) await redisClient.del(key);
};

export const refreshUserToken = async (token: string) => {
  const verify = verifyRefreshToken(token) as ITokenPayload;
  const oldTokenHash = hashToken(token);

  const sessionKey = redisKeys.session(verify.id, oldTokenHash);
  const cachedSession = await redisClient.get(sessionKey);

  if (!cachedSession) throw new UnauthorizedError("Session expired. Please login again.");

  const sessionData = JSON.parse(cachedSession);

  const dbToken = await prisma.refreshToken.findUnique({
    where: { token: oldTokenHash },
  });

  if (!dbToken) throw new UnauthorizedError("Invalid session. Please login again.");

  if (sessionData.isRevoked) {
    let revokedAt = sessionData.revokedAt;

    if (!revokedAt) revokedAt = dbToken.revokedAt?.getTime();

    if (!revokedAt) throw new UnauthorizedError("Invalid session state.");

    const timeSinceRevoke = Date.now() - revokedAt;

    if (timeSinceRevoke < AUTH_CONFIG.GRACE_PERIOD)
      throw new TooManyRequestsError("Processing request, please wait.");

    await revokeAllUserSessions(verify.id);

    await prisma.refreshToken.updateMany({
      where: { userId: verify.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    throw new UnauthorizedError("Security Alert: Token reuse detected!");
  }

  const newAccessToken = signAccessToken(verify.id);
  const newRefreshToken = signRefreshToken(verify.id);
  const newTokenHash = hashToken(newRefreshToken);

  await redisClient.setEx(
    sessionKey,
    Math.floor(AUTH_CONFIG.GRACE_PERIOD / 1000),
    JSON.stringify({
      ...sessionData,
      isRevoked: true,
      revokedAt: Date.now(),
    })
  );

  await redisClient.setEx(
    redisKeys.session(verify.id, newTokenHash),
    Math.floor(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN / 1000),
    JSON.stringify({
      userId: verify.id,
      isRevoked: false,
      createdAt: Date.now(),
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
    })
  );

  await prisma.refreshToken.update({
    where: { token: oldTokenHash },
    data: {
      replacedBy: newTokenHash,
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  await prisma.refreshToken.create({
    data: {
      token: newTokenHash,
      userId: verify.id,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN),
    },
  });

  return { newAccessToken, newRefreshToken };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) throw new NotFoundError("User not found.");

  return user;
};

export const verifyUserOTP = async (verifyData: IVerifyInput) => {
  const { email, code } = verifyData;

  const otpKey = redisKeys.otp(email);
  const cachedCode = await redisClient.get(otpKey);

  if (!cachedCode) throw new BadRequestError("Verification code has expired or does not exist.");

  if (cachedCode !== code) throw new BadRequestError("Invalid verification code.");

  const user = await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  await redisClient.del(otpKey);

  const refreshToken = signRefreshToken(user.id);
  const accessToken = signAccessToken(user.id);
  const hashedRefreshToken = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN),
    },
  });

  await redisClient.setEx(
    redisKeys.session(user.id, hashedRefreshToken),
    Math.floor(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN / 1000),
    JSON.stringify({
      userId: user.id,
      isRevoked: false,
      createdAt: Date.now(),
    })
  );

  return { user: toSafeUser(user), accessToken, refreshToken };
};
