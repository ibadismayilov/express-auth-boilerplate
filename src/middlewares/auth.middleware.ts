import { catchAsync } from "../utils/catch.async";
import { verifyAccessToken } from "../utils/jwt.util";
import { prisma } from "../lib/prisma";
import { UnauthorizedError } from "../errors/custom.error";

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new UnauthorizedError("Unauthorized.");

  const token = authHeader.split(" ")[1];

  let verify;

  try {
    verify = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token.");
  }

  const current_user = await prisma.user.findUnique({
    where: { id: verify.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  if (!current_user) throw new UnauthorizedError("The user with this token no longer exists.");

  req.user = current_user;

  next();
});
