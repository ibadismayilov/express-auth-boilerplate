import { prisma } from "../lib/prisma";
import { redisClient } from "../lib/redis";

export const banIp = async (ip: string, ttl = 3600) => {
  await redisClient.setEx(`ban:ip:${ip}`, ttl, "1");
};

export const unbanIp = async (ip: string) => {
  await redisClient.del(`ban:ip:${ip}`);
};

export const isIpBanned = async (ip: string) => {
  const result = await redisClient.get(`ban:ip:${ip}`);

  return !!result;
};

export const banUser = async (userId: string, ttl = 86400) => {
  await redisClient.setEx(`ban:user:${userId}`, ttl, "1");
};

export const unbanUser = async (userId: string) => {
  await redisClient.del(`ban:user:${userId}`);
};

export const isUserBanned = async (userId: string) => {
  const result = await redisClient.get(`ban:user:${userId}`);
  return !!result;
};

export const softDeleteUser = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true },
  });

  await banUser(userId, 24 * 60 * 60);
};
