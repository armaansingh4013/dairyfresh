import mongoose from "mongoose";

const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    name: String,
    description: String,
    unit: { type: String, default: "L" },
    price: Number,
    imageUrl: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);