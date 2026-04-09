import mongoose from "mongoose";

const { Schema, Types } = mongoose;
const ObjectId = Types.ObjectId;

const PlanDaySchema = new Schema(
  {
    date: { type: Date, required: true },
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["PENDING", "SKIPPED", "MISSED", "DELIVERED"],
      default: "PENDING"
    },
    delivered: { type: Number, default: 0 },
    addressId: ObjectId
  },
  { _id: false }
);

const PlanSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    productId: { type: ObjectId, ref: "Product", required: true },
    addressId: ObjectId,
    mode: { type: String, enum: ["EVERYDAY", "CUSTOM"], required: true },
    startDate: Date,
    endDate: Date,
    defaultQuantity: Number,
    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED"],
      default: "ACTIVE"
    },
    days: {
      type: Map,
      of: PlanDaySchema,
      default: {}
    },
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);