import { catchAsync } from "../utils/catch.async";
import { ForbiddenError, UnauthorizedError } from "../errors/custom.error";

export const authorizeRoles = (roles: string[]) => {
  return catchAsync(async (req, _res, next) => {
    const user = req.user;

    if (!user) throw new UnauthorizedError("Unauthorized.");

    if (!roles.includes(user.role))
      throw new ForbiddenError("Forbidden: insufficient permissions.");

    next();
  });
};
