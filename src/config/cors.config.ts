import { CorsOptions } from "cors";
import { env } from "./environment.config";

const allowed_origins =env.allowedOrigins;

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowed_origins.includes(origin)) callback(null, true);
    else callback(new Error("Blocked by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
