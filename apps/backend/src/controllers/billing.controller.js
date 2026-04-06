import { createPayment } from "../services/billing.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { createPaymentSchema } from "../validations/billing.validation.js";

export async function createPaymentController(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();

  const payment = await createPayment(req.params.invoiceId, parsed.data.provider);
  if (!payment) throw notFound("Invoice not found");

  res.json(payment);
}