import mongoose from "mongoose";

const { Schema, Types } = mongoose;
const ObjectId = Types.ObjectId;

const OrderItemSchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    addressId: { type: ObjectId, required: true },

    type: {
      type: String,
      enum: ["NORMAL", "PLAN"],
      required: true
    },

    planId: { type: ObjectId, ref: "Plan", default: null },

    date: { type: Date, required: true },

    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one item is required"
      }
    },

    status: {
      type: String,
      enum: ["PLACED", "SCHEDULED", "COMPLETED", "CANCELLED"],
      default: "PLACED"
    },

    note: { type: String, default: "" },
    source: { type: String, default: "APP" }
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, date: -1 });
OrderSchema.index({ planId: 1 });

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);