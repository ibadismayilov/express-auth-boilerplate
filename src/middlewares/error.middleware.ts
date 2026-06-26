import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { AppError } from "../errors/app.error";
import { env } from "../config/environment";

export const globalErrorHandler = (
  err: Error | AppError, 
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const status = err instanceof AppError ? err.status : "error";
  const errors = err instanceof AppError ? err.errors : undefined;

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${err.message}`, {
      stack: err.stack,
      statusCode,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${err.message}`, {
      statusCode,
      path: req.path,
      method: req.method,
    });
  }

  if (env.nodeEnv === "development") {
    return res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  if (err instanceof AppError) {
    return res.status(statusCode).json({
      status,
      message: err.message,
      ...(errors && { errors }),
    });
  }

  logger.error("UNHANDLED ERROR:", {
    error: err,
    stack: err.stack,
  });

  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};