import "dotenv/config";
import app from "./app";
import { connectRedis } from "./lib/redis";
import { env } from "./config/environment";

const start = async () => {
  await connectRedis();

  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down...");
    server.close(() => console.log("Process terminated"));
  });
};

start();
