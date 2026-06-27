import { catchAsync } from "../utils/catch.async";
import * as AdminService from "../services/admin.service";
import { BadRequestError } from "../errors/custom.error";

export const adminBanIp = catchAsync(async (req, res) => {
  const { ip } = req.body;

  await AdminService.banIp(ip, 24 * 60 * 60);

  res.status(200).json({
    status: "success",
    message: "IP banned successfully",
  });
});

export const adminUnbanIp = catchAsync(async (req, res) => {
  const { ip } = req.body;

  await AdminService.unbanIp(ip);

  res.status(200).json({
    status: "success",
    message: "IP unbanned successfully",
  });
});

export const handleBanUser = catchAsync(async (req, res) => {
  const { userId, ttl } = req.body;

  if (!userId) throw new BadRequestError("User ID not sent");

  await AdminService.banUser(userId, ttl);

  res.status(200).json({ status: "success", message: "User blocked." });
});

export const handleUnbanUser = catchAsync(async (req, res) => {
  const { userId } = req.body;

  if (!userId) throw new BadRequestError("User ID not sent");

  await AdminService.unbanUser(userId);

  res.status(200).json({ status: "success", message: "User's block has been unblocked.." });
});

export const handleDeleteUser = catchAsync(async (req, res) => {
  const { userId } = req.body;

  if (!userId) throw new BadRequestError("User ID not sent");

  await AdminService.softDeleteUser(userId);

  res.status(200).json({
    status: "success",
    message: "User has been permanently deleted.",
  });
  return;
});
