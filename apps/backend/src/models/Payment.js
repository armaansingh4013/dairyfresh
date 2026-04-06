import mongoose from "mongoose";

const { Schema, Types } = mongoose;
const ObjectId = Types.ObjectId;

const PaymentSchema = new Schema(
  {
    invoiceId: { type: ObjectId, ref: "Invoice", required: true },
    provider: String,
    amount: Number,
    status: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED"]
    },
    reference: String
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);