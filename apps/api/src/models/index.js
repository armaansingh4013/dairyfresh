import mongoose from "mongoose";

const { Schema, Types } = mongoose;
const ObjectId = Types.ObjectId;

const UserSchema = new Schema(
  {
    phone: { type: String, unique: true, required: true },
    email: { type: String, unique: true, sparse: true },
    name: String,
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN", "STAFF"],
      default: "CUSTOMER"
    },
    addresses: [
      {
        title: String,
        houseNumber: String,
        line1: String,
        line2: String,
        landmark: String,
        city: String,
        state: String,
        postalCode: String,
        lat: Number,
        lng: Number,
        isDefault: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

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

// const PlanSchema = new Schema(
//   {
//     userId: { type: ObjectId, ref: "User", required: true },
//     productId: { type: ObjectId, ref: "Product", required: true },
//     mode: { type: String, enum: ["EVERYDAY", "CUSTOM"], required: true },
//     startDate: Date,
//     endDate: Date,
//     defaultQuantity: Number,
//     status: {
//       type: String,
//       enum: ["ACTIVE", "PAUSED", "CANCELLED"],
//       default: "ACTIVE"
//     },
//     days: [
//       {
//         date: Date,
//         quantity: Number,
//         addressId: ObjectId
//       }
//     ],
//     pauses: [
//       {
//         startDate: Date,
//         endDate: Date
//       }
//     ]
//   },
//   { timestamps: true }
// );

const PlanSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    productId: { type: ObjectId, ref: "Product", required: true },

    mode: { type: String, enum: ["EVERYDAY", "CUSTOM"], required: true },

    startDate: Date,
    endDate: Date,

    defaultQuantity: Number,

    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED"],
      default: "ACTIVE"
    },

    // ⭐ DAYS AS MAP WITH DATE KEYS
    days: {
      type: Map,
      of: new Schema(
        {
          date: { type: Date, required: true },
          quantity: { type: Number, default: 1 },

          // ⭐ status of that day
          status: {
            type: String,
            enum: ["PENDING", "SKIPPED", "MISSED", "DELIVERED"],
            default: "PENDING"
          },

          // ⭐ 1 = delivered, 0 = not delivered
          delivered: { type: Number, default: 0 },

          addressId: ObjectId
        },
        { _id: false }
      ),
      default: {}
    },

    // ⭐ SUMMARY FIELDS
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const DeliverySchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User" },
    planId: { type: ObjectId, ref: "Plan" },
    productId: { type: ObjectId, ref: "Product" },
    addressId: ObjectId,
    date: Date,
    quantity: Number,
    status: {
      type: String,
      enum: ["PENDING", "DELIVERED", "MISSED", "CANCELLED"],
      default: "PENDING"
    },
    note: String
  },
  { timestamps: true }
);

DeliverySchema.index({ userId: 1, date: 1, productId: 1 }, { unique: true });

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

const OrderSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    addressId: { type: ObjectId, required: true },
    type: {
      type: String,
      enum: ["NORMAL", "SUBSCRIPTION"],
      default: "NORMAL"
    },
    planId: { type: ObjectId, ref: "Plan", default: null },
    date: { type: Date, required: true },
    note: String,
    status: {
      type: String,
      enum: ["PLACED", "DELIVERED", "CANCELLED"],
      default: "PLACED"
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "SUCCESS"
    },
    totalAmount: { type: Number, default: 0 },
    items: [
      {
        productId: { type: ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        productName: String,
        unit: String,
        unitPrice: Number
      }
    ]
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
export const Delivery = mongoose.models.Delivery || mongoose.model("Delivery", DeliverySchema);
export const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
export const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export { mongoose, ObjectId };
