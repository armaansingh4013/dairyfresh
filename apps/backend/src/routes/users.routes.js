import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createUserAddress,
  createUserPlan,
  deleteAddressController,
  getUserAddresses,
  getUserDeliveries,
  getUserInvoices,
  getUserPlans,
  getUserSummary,
  updateAddressController,
  updateUserController,
  getUserOrdersFromUsersController
} from "../controllers/users.controller.js";

const router = Router();

router.get("/:userId/addresses", asyncHandler(getUserAddresses));
router.post("/:userId/addresses", asyncHandler(createUserAddress));
router.patch("/:userId", asyncHandler(updateUserController));

router.patch("/addresses/:addressId", asyncHandler(updateAddressController));
router.delete("/addresses/:addressId", asyncHandler(deleteAddressController));

router.get("/:userId/plans", asyncHandler(getUserPlans));
router.post("/:userId/plans", asyncHandler(createUserPlan));

router.get("/:userId/deliveries", asyncHandler(getUserDeliveries));
router.get("/:userId/invoices", asyncHandler(getUserInvoices));
router.get("/:userId/summary", asyncHandler(getUserSummary));

router.get("/:userId/orders", asyncHandler(getUserOrdersFromUsersController));

export default router;