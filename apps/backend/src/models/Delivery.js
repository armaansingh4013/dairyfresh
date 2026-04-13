import mongoose from "mongoose";

const { Schema, Types } = mongoose;
const ObjectId = Types.ObjectId;

const DeliverySchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User" },
    deliveryPersonId: { type: ObjectId, ref: "User", default: null },
    planId: { type: ObjectId, ref: "Plan" },
    productId: { type: ObjectId, ref: "Product" },
    addressId: ObjectId,
    date: Date,
    quantity: Number,
    status: {
      type: String,
      enum: ["PENDING", "DELIVERED", "MISSED", "CANCELLED", "SKIPPED"],
      default: "PENDING"
    },
    note: String
  },
  { timestamps: true }
);

DeliverySchema.index({ userId: 1, date: 1, productId: 1 }, { unique: true });

export const Delivery = mongoose.models.Delivery || mongoose.model("Delivery", DeliverySchema);
