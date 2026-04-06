import { updateDelivery } from "../services/deliveries.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { updateDeliverySchema } from "../validations/deliveries.validation.js";

export async function updateDeliveryController(req, res) {
  const parsed = updateDeliverySchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const delivery = await updateDelivery(req.params.deliveryId, parsed.data);
  if (!delivery) throw notFound("Delivery not found");

  res.json(delivery);
}