import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./products.routes.js";
import userRoutes from "./users.routes.js";
import planRoutes from "./plans.routes.js";
import adminRoutes from "./admin.routes.js";
import deliveryRoutes from "./deliveries.routes.js";
import billingRoutes from "./billing.routes.js";
import ordersRoutes from "./orders.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/plans", planRoutes);
router.use("/admin", adminRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/orders", ordersRoutes);
router.use("/", billingRoutes);

export default router;