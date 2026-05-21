import { ForbiddenError } from "../errors/custom.error";
import { redisClient } from "../lib/redis";
import { catchAsync } from "../utils/catch.async";

export const checkIpBan = catchAsync(async (req, _res, next) => {
  const ip = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress;

  if (!ip) return next();

  const banned = await redisClient.get(`ban:ip:${ip}`);

  if (banned) throw new ForbiddenError("IP banned.")

  next();
});
