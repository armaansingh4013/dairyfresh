import { createOrder, listUserOrders } from "../services/orders.service.js";
import { badRequest } from "../utils/response.js";
import { createOrderSchema } from "../validations/orders.validation.js";

export async function createOrderController(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid payload");

  const order = await createOrder(parsed.data);
  res.status(201).json(order);
}

export async function getUserOrdersController(req, res) {
  const orders = await listUserOrders(req.params.userId);
  res.json(orders);
}