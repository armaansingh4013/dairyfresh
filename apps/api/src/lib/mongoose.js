import { mongoose } from "../models/index.js";

let connectPromise;

export async function connectMongoose() {
  if (!connectPromise) {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error("Missing MONGODB_URL. Add it to apps/api/.env.");
    }

    connectPromise = mongoose.connect(mongoUrl, {
      dbName: process.env.MONGODB_DB
    });
  }

  return connectPromise;
}
