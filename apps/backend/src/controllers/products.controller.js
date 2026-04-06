import { createProduct, listProducts, updateProduct } from "../services/products.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { createProductSchema, updateProductSchema } from "../validations/products.validation.js";

export async function getProducts(req, res) {
  const includeInactive = String(req.query.includeInactive || "") === "true";
  const products = await listProducts(includeInactive);
  res.json(products);
}

export async function createProductController(req, res) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const product = await createProduct(parsed.data);
  res.json(product);
}

export async function updateProductController(req, res) {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const product = await updateProduct(req.params.productId, parsed.data);
  if (!product) throw notFound("Product not found");

  res.json(product);
}