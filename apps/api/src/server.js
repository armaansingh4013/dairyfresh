import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import userRoutes from "./routes/users.js";
import planRoutes from "./routes/plans.js";
import adminRoutes from "./routes/admin.js";
import deliveryRoutes from "./routes/deliveries.js";
import billingRoutes from "./routes/billing.js";
import { ensureCoreDemoData } from "./lib/demo.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/plans", planRoutes);
app.use("/admin", adminRoutes);
app.use("/deliveries", deliveryRoutes);
app.use("/", billingRoutes);

try {
  ensureCoreDemoData();
} catch (error) {
  console.error("Unable to seed demo data on startup", error);
}

const port = process.env.PORT || 4000;
if (process.env.NO_LISTEN !== "1") {
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
}

export default app;
