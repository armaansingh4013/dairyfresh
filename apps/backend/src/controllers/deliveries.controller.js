import {
  listDeliveriesForDeliveryPerson,
  markDeliveryDeliveredForPerson,
  updateDelivery
} from "../services/deliveries.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { updateDeliverySchema } from "../validations/deliveries.validation.js";

export async function updateDeliveryController(req, res) {
  const parsed = updateDeliverySchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const delivery =
    req.auth?.user?.role === "DELIVERY"
      ? await markDeliveryDeliveredForPerson(req.params.deliveryId, req.auth.user._id)
      : await updateDelivery(req.params.deliveryId, parsed.data);
  if (!delivery) throw notFound("Delivery not found");

  res.json(delivery);
}

export async function getMyTodayDeliveriesController(req, res) {
  res.json(await listDeliveriesForDeliveryPerson(req.auth.user._id, "PENDING"));
}

export async function getMyDeliveredDeliveriesController(req, res) {
  res.json(await listDeliveriesForDeliveryPerson(req.auth.user._id, "DELIVERED"));
}
