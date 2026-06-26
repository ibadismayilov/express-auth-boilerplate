import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "../config/environment";

const pool = new pg.Pool({ connectionString: env.db.url});
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter,
    log: ["query", "error", "warn"],
  });

if (env.nodeEnv !== "production") globalForPrisma.prisma = prisma;
