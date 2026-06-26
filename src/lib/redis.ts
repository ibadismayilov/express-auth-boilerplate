import { createClient } from "redis";
import { env } from "../config/environment";

export const redisClient = createClient({
  url: env.redis.url,
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) await redisClient.connect();
};
