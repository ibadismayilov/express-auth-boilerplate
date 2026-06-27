import { NextFunction, Request, Response } from "express";
import { isUserBanned } from "../services/admin.service";
import { ForbiddenError } from "../errors/custom.error";

export const checkBanMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (userId) {
    const userBanned = await isUserBanned(userId);

    if (userBanned) throw new ForbiddenError("Your account has been frozen by the admin.");
  }

  next();
};
