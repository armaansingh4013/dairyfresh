// import mongoose from "mongoose";

// const { Schema } = mongoose;

// const AddressSchema = new Schema(
//   {
//     title: String,
//     houseNumber: String,
//     line1: String,
//     line2: String,
//     landmark: String,
//     city: String,
//     state: String,
//     postalCode: String,
//     lat: Number,
//     lng: Number,
//     isDefault: { type: Boolean, default: false }
//   },
//   { _id: true }
// );

// const UserSchema = new Schema(
//   {
//     phone: { type: String, unique: true, required: true },
//     email: { type: String, unique: true, sparse: true },
//     name: String,
//     role: {
//       type: String,
//       enum: ["CUSTOMER", "ADMIN", "STAFF"],
//       default: "CUSTOMER"
//     },
//     addresses: [AddressSchema]
//   },
//   { timestamps: true }
// );

// export const User = mongoose.models.User || mongoose.model("User", UserSchema);


import mongoose from "mongoose";

const { Schema } = mongoose;

const AddressSchema = new Schema(
  {
    title: String,
    recipientName: String,
    recipientPhone: String,
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
    username: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    name: String,
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN", "DELIVERY", "STAFF"],
      default: "CUSTOMER"
    },
    addresses: [AddressSchema],

    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpChannel: {
      type: String,
      enum: ["EMAIL", "PHONE", null],
      default: null
    },
    isEmailVerified: { type: Boolean, default: false },
    passwordHash: { type: String, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
