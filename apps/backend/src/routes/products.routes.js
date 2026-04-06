import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProductController,
  getProducts,
  updateProductController
} from "../controllers/products.controller.js";

const router = Router();

router.get("/", asyncHandler(getProducts));
router.post("/", asyncHandler(createProductController));
router.patch("/:productId", asyncHandler(updateProductController));

export default router;