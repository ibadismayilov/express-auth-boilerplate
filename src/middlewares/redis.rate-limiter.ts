import { Request, Response, NextFunction } from "express";
import { redisClient } from "../lib/redis";
import { catchAsync } from "../utils/catch.async";
import { TooManyRequestsError } from "../errors/custom.error";

const PENALTY_TIMES = [60, 300, 900, 3600];

export const progressiveRateLimit = (maxRequests: number, windowSeconds: number) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip || "unknown";

    const requestKey = `rate:req:${identifier}`;
    const violationKey = `rate:viol:${identifier}`;
    const banKey = `rate:ban:${identifier}`;

    const isBanned = await redisClient.get(banKey);
    if (isBanned) {
      const ttl = await redisClient.ttl(banKey);
      const minutesLeft = Math.ceil(ttl / 60);
      throw new TooManyRequestsError(
        `Too many requests. You are temporarily blocked. Please try again in ${minutesLeft} minute(s).`
      );
    }

    const currentRequests = await redisClient.incr(requestKey);

    if (currentRequests === 1) await redisClient.expire(requestKey, windowSeconds);

    if (currentRequests > maxRequests) {
      const alreadyBanned = await redisClient.get(banKey);

      if (!alreadyBanned) {
        const violations = await redisClient.incr(violationKey);
        await redisClient.expire(violationKey, 86400);

        const penaltyIndex = Math.min(violations - 1, PENALTY_TIMES.length - 1);
        const banDuration = PENALTY_TIMES[penaltyIndex];

        await redisClient.set(banKey, "true", { EX: banDuration });

        await redisClient.del(requestKey);

        const minutesLeft = Math.ceil(banDuration / 60);
        throw new TooManyRequestsError(
          `Rate limit exceeded. You have been restricted for ${minutesLeft} minute(s).`
        );
      } else {
        const ttl = await redisClient.ttl(banKey);
        const minutesLeft = Math.ceil(ttl / 60);
        throw new TooManyRequestsError(
          `Too many requests. You are temporarily blocked. Please try again in ${minutesLeft} minute(s).`
        );
      }
    }

    next();
  });
};
