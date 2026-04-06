import { Product } from "../models/index.js";

export async function listProducts(includeInactive = false) {
  return Product.find(includeInactive ? {} : { isActive: true }).sort({ createdAt: -1 });
}

export async function createProduct(payload) {
  return Product.create({
    description: "",
    imageUrl: "",
    isActive: true,
    ...payload
  });
}

export async function updateProduct(productId, payload) {
  const product = await Product.findById(productId);
  if (!product) return null;

  Object.assign(product, payload);
  await product.save();
  return product;
}