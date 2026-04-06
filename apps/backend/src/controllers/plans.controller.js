import { badRequest, notFound } from "../utils/response.js";
import { updatePlanSchema, upsertPlanDaysSchema } from "../validations/plans.validation.js";
import { getPlanById, updatePlan, upsertPlanDays } from "../services/plans.service.js";


// export async function updatePlanController(req, res) {
//   const parsed = updatePlanSchema.safeParse(req.body);
//   if (!parsed.success) throw badRequest();

//   const plan = await updatePlan(req.params.planId, parsed.data);
//   if (!plan) throw notFound("Plan not found");

//   res.json(plan);
// }

// export async function upsertPlanDaysController(req, res) {
//   const parsed = upsertPlanDaysSchema.safeParse(req.body);
//   if (!parsed.success) throw badRequest();

//   const result = await upsertPlanDays(req.params.planId, parsed.data.days);
//   res.json(result);
// }


export async function getPlanByIdController(req, res) {
    const plan = await getPlanById(req.params.planId);
    if (!plan) throw notFound("Plan not found");
    res.json(plan);
  }
  
  export async function updatePlanController(req, res) {
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest();
  
    const plan = await updatePlan(req.params.planId, parsed.data);
    if (!plan) throw notFound("Plan not found");
  
    res.json(plan);
  }
  
  export async function upsertPlanDaysController(req, res) {
    const parsed = upsertPlanDaysSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest();
  
    const result = await upsertPlanDays(req.params.planId, parsed.data.days);
    res.json(result);
  }