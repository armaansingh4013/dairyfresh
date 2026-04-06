import mongoose from "mongoose";
import { User } from "./User.js";
import { Product } from "./Product.js";
import { Plan } from "./Plan.js";
import { Delivery } from "./Delivery.js";
import { Invoice } from "./Invoice.js";
import { Payment } from "./Payment.js";
import { Order } from "./Order.js";

const { Types } = mongoose;
const ObjectId = Types.ObjectId;

export { mongoose, ObjectId, User, Product, Plan, Delivery, Invoice, Payment, Order };