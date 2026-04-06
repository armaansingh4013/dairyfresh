import mongoose from "mongoose";

const { Schema, Types } = mongoose;
const ObjectId = Types.ObjectId;

const InvoiceSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    month: Number,
    year: Number,
    totalAmount: Number,
    status: {
      type: String,
      enum: ["DUE", "PAID", "OVERDUE"],
      default: "DUE"
    },
    pdfUrl: String
  },
  { timestamps: true }
);

InvoiceSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);