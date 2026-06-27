import { Router } from "express";
import {
  adminBanIp,
  adminUnbanIp,
  handleBanUser,
  handleDeleteUser,
  handleUnbanUser,
} from "../controllers/admin.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import validateInput from "../middlewares/validate.middleware";
import {
  banIpSchema,
  banUserSchema,
  deleteUserSchema,
  unbanIpSchema,
  unbanUserSchema,
} from "../validators/admin.validator";

const router = Router();

router.post("/ban-ip", protect, authorizeRoles(["ADMIN"]), validateInput(banIpSchema), adminBanIp);

router.post(
  "/unban-ip",
  protect,
  authorizeRoles(["ADMIN"]),
  validateInput(unbanIpSchema),
  adminUnbanIp
);

router.post(
  "/ban-user",
  protect,
  authorizeRoles(["ADMIN"]),
  validateInput(banUserSchema),
  handleBanUser
);

router.post(
  "/unban-user",
  protect,
  authorizeRoles(["ADMIN"]),
  validateInput(unbanUserSchema),
  handleUnbanUser
);

router.post(
  "/soft-delete-user",
  protect,
  authorizeRoles(["ADMIN"]),
  validateInput(deleteUserSchema),
  handleDeleteUser
);

export default router;
