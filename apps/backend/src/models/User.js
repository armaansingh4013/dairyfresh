import mongoose from "mongoose";

const { Schema } = mongoose;

const AddressSchema = new Schema(
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
  },
  { _id: true }
);

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
    addresses: [AddressSchema]
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);