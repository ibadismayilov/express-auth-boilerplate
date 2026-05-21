import { User } from "@prisma/client";

export const toSafeUser = (user: User) => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
};