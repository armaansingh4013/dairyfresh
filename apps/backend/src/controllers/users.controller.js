import { listUserDeliveries } from "../services/deliveries.service.js";
import { listUserInvoices } from "../services/billing.service.js";
import { createPlan, listUserPlans } from "../services/plans.service.js";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  updateUserProfile
} from "../services/users.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { sanitizeUser } from "../utils/session.js";
import { toDateOnly } from "../utils/date.js";
import {
  createAddressSchema,
  createUserPlanSchema,
  updateAddressSchema,
  updateUserSchema
} from "../validations/users.validation.js";
import { listUserOrders } from "../services/orders.service.js";




export async function getUserAddresses(req, res) {
  res.json(await listAddresses(req.params.userId));
}

export async function createUserAddress(req, res) {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const address = await createAddress(req.params.userId, parsed.data);
  res.json(address);
}

export async function updateUserController(req, res) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const user = await updateUserProfile(req.params.userId, parsed.data);
  if (!user) throw notFound("User not found");

  res.json(sanitizeUser(user));
}

export async function updateAddressController(req, res) {
  const parsed = updateAddressSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const address = await updateAddress(req.params.addressId, parsed.data);
  if (!address) throw notFound("Address not found");

  res.json(address);
}

export async function deleteAddressController(req, res) {
  await deleteAddress(req.params.addressId);
  res.json({ success: true });
}

export async function getUserPlans(req, res) {
  res.json(await listUserPlans(req.params.userId));
}

export async function createUserPlan(req, res) {
  const parsed = createUserPlanSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const startDate = toDateOnly(parsed.data.startDate);
  const endDate = toDateOnly(parsed.data.endDate);

  if (endDate < startDate) {
    throw badRequest("endDate must be after startDate");
  }

  const plan = await createPlan(req.params.userId, parsed.data);
  if (!plan) {
    throw badRequest("Invalid userId or productId");
  }

  res.json(plan);
}

export async function getUserDeliveries(req, res) {
  res.json(await listUserDeliveries(req.params.userId));
}

export async function getUserInvoices(req, res) {
  res.json(await listUserInvoices(req.params.userId));
}

export async function getUserSummary(req, res) {
  const [addresses, plans, deliveries, invoices] = await Promise.all([
    listAddresses(req.params.userId),
    listUserPlans(req.params.userId),
    listUserDeliveries(req.params.userId),
    listUserInvoices(req.params.userId)
  ]);

  if (
    addresses.length === 0 &&
    plans.length === 0 &&
    deliveries.length === 0 &&
    invoices.length === 0
  ) {
    // still allow empty summary for existing user? keep current simple behavior
  }

  res.json({
    addresses,
    plans,
    deliveries: deliveries.sort((a, b) => new Date(a.date) - new Date(b.date)),
    invoices
  });
}


export async function getUserOrdersFromUsersController(req, res) {
  res.json(await listUserOrders(req.params.userId));
}