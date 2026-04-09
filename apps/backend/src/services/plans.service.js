import { Delivery, Plan, Product, User } from "../models/index.js";
import { addDays, toDateKey, toDateOnly } from "../utils/date.js";
import { hydrateDelivery, recalculatePlanStats, upsertDeliveryRecord } from "./deliveries.service.js";
import { createPlanOrder } from "./orders.service.js";


function getDefaultAddress(user) {
  return user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;
  
}

async function getAddress(user,addressId) {
  const userObj = await User.findById(user);
  console.log("User object:", userObj.addresses.id(addressId));
  return userObj?.addresses?.id(addressId) || null;
}

export async function hydratePlan(planDoc) {
  if (!planDoc) return null;

  const plan = await Plan.findById(planDoc._id).populate("productId");
  if (!plan) return null;

//   const deliveries = await Delivery.find({ planId: plan._id }).sort({ date: 1 });
//   const hydratedDeliveries = await Promise.all(
//     deliveries.map((delivery) => hydrateDelivery(delivery, { includePlan: false }))
//   );
  return {
    ...plan.toObject({ depopulate: false }),
    id: plan._id.toString(),
    user: plan.userId,
    product: plan.productId,
    address: await getAddress(plan.userId,plan.addressId )|| null
    // deliveries: hydratedDeliveries
  };
}

export async function listUserPlans(userId) {
  const plans = await Plan.find({ userId }).sort({ createdAt: -1 });
  return Promise.all(plans.map((plan) => hydratePlan(plan)));
}

// export async function createPlan(userId, payload) {
//   const user = await User.findById(userId);
//   const product = await Product.findById(payload.productId);
//   if (!user || !product) return null;

//   const daysMap = {};
//   for (const day of payload.days || []) {
//     const normalizedDate = toDateOnly(day.date);
//     const key = toDateKey(normalizedDate);
//     daysMap[key] = {
//       date: normalizedDate,
//       quantity: day.quantity,
//       addressId: day.addressId || null,
//       status: "PENDING",
//       delivered: 0
//     };
//   }

//   const plan = await Plan.create({
//     userId,
//     productId: payload.productId,
//     startDate: toDateOnly(payload.startDate),
//     endDate: toDateOnly(payload.endDate),
//     mode: payload.mode,
//     defaultQuantity: payload.defaultQuantity,
//     status: "ACTIVE",
//     days: daysMap
//   });

//   const defaultAddress = getDefaultAddress(user);

//   for (
//     let current = toDateOnly(payload.startDate);
//     current <= toDateOnly(payload.endDate);
//     current = addDays(current, 1)
//   ) {
//     const key = toDateKey(current);
//     const override = daysMap[key];

//     const quantity =
//       payload.mode === "CUSTOM"
//         ? Number(override?.quantity || 0)
//         : Number(override?.quantity ? payload.defaultQuantity : 0);

//     const resolvedAddressId = override?.addressId || defaultAddress?._id || null;
//     if (quantity <= 0 || !resolvedAddressId) continue;

//     await upsertDeliveryRecord({
//       userId,
//       addressId: resolvedAddressId,
//       productId: payload.productId,
//       planId: plan._id,
//       date: current,
//       quantity,
//       status: "PENDING",
//       note: ""
//     });
//   }

//   await recalculatePlanStats(plan._id);
//   return hydratePlan(plan);
// }

export async function updatePlan(planId, payload) {
  const plan = await Plan.findById(planId);
  if (!plan) return null;

  Object.assign(plan, payload);
  await plan.save();

  if (payload.status === "CANCELLED") {
    await Delivery.updateMany(
      {
        planId: plan._id,
        status: "PENDING",
        date: { $gte: toDateOnly(new Date()) }
      },
      {
        $set: {
          status: "CANCELLED",
          updatedAt: new Date()
        }
      }
    );
  }

  await recalculatePlanStats(plan._id);
  return hydratePlan(plan);
}

export async function upsertPlanDays(planId, days) {
  const plan = await Plan.findById(planId).populate("userId");
  if (!plan) return [];

  const user = plan.userId;
  const defaultAddress = getDefaultAddress(user);

  for (const day of days) {
    const dayDate = toDateOnly(day.date);
    const key = toDateKey(dayDate);

    const previous = plan.days.get(key) || null;
    const nextValue = {
      date: dayDate,
      quantity: day.quantity,
      addressId: day.addressId || previous?.addressId || null,
      status: day.status || previous?.status || "PENDING",
      delivered: day.delivered ?? previous?.delivered ?? 0
    };

    if (day.quantity <= 0) {
      nextValue.status = "SKIPPED";
      nextValue.delivered = 0;
    }

    plan.days.set(key, nextValue);

    const targetAddressId = nextValue.addressId || defaultAddress?._id || null;

    const delivery = await Delivery.findOne({
      planId: plan._id,
      productId: plan.productId,
      date: { $gte: dayDate, $lt: addDays(dayDate, 1) }
    });

    if (day.quantity <= 0) {
      if (delivery) {
        delivery.quantity = 0;
        delivery.status = "SKIPPED";
        await delivery.save();
      }
      continue;
    }

    if (!targetAddressId) continue;

    await upsertDeliveryRecord({
      userId: plan.userId._id,
      addressId: targetAddressId,
      productId: plan.productId,
      planId: plan._id,
      date: dayDate,
      quantity: day.quantity,
      status: delivery?.status === "DELIVERED" ? "DELIVERED" : nextValue.status,
      note: delivery?.note || ""
    });
  }

  await plan.save();
  await recalculatePlanStats(plan._id);

  return Object.fromEntries(plan.days);
}


export async function getPlanById(planId) {
    const plan = await Plan.findById(planId);
    if (!plan) return null;
    return hydratePlan(planId);
  }



  // export async function createPlan(userId, payload) {
  //   const user = await User.findById(userId);
  //   const product = await Product.findById(payload.productId);
  //   if (!user || !product) return null;
  
  //   const daysMap = {};
  //   for (const day of payload.days || []) {
  //     const normalizedDate = toDateOnly(day.date);
  //     const key = toDateKey(normalizedDate);
  //     daysMap[key] = {
  //       date: normalizedDate,
  //       quantity: day.quantity,
  //       addressId: day.addressId || null,
  //       status: "PENDING",
  //       delivered: 0
  //     };
  //   }
  
  //   const plan = await Plan.create({
  //     userId,
  //     productId: payload.productId,
  //     startDate: toDateOnly(payload.startDate),
  //     endDate: toDateOnly(payload.endDate),
  //     mode: payload.mode,
  //     defaultQuantity: payload.defaultQuantity,
  //     status: "ACTIVE",
  //     days: daysMap
  //   });
  
  //   const defaultAddress = getDefaultAddress(user);
  //   let planOrderAddressId = null;
  //   let planOrderQuantity = 0;
  
  //   for (
  //     let current = toDateOnly(payload.startDate);
  //     current <= toDateOnly(payload.endDate);
  //     current = addDays(current, 1)
  //   ) {
  //     const key = toDateKey(current);
  //     const override = daysMap[key];
  
  //     const quantity =
  //       payload.mode === "CUSTOM"
  //         ? Number(override?.quantity || 0)
  //         : Number(override?.quantity ? payload.defaultQuantity : 0);
  
  //     const resolvedAddressId = override?.addressId || defaultAddress?._id || null;
  //     if (quantity <= 0 || !resolvedAddressId) continue;
  
  //     if (!planOrderAddressId) {
  //       planOrderAddressId = resolvedAddressId;
  //       planOrderQuantity = quantity;
  //     }
  
  //     await upsertDeliveryRecord({
  //       userId,
  //       addressId: resolvedAddressId,
  //       productId: payload.productId,
  //       planId: plan._id,
  //       date: current,
  //       quantity,
  //       status: "PENDING",
  //       note: ""
  //     });
  //   }
  
  //   if (planOrderAddressId) {
  //     await createPlanOrder({
  //       userId,
  //       addressId: planOrderAddressId,
  //       planId: plan._id,
  //       date: payload.startDate,
  //       items: [
  //         {
  //           productId: payload.productId,
  //           quantity: planOrderQuantity > 0 ? planOrderQuantity : payload.defaultQuantity || 1
  //         }
  //       ],
  //       note: "Plan created"
  //     });
  //   }
  
  //   await recalculatePlanStats(plan._id);
  //   return hydratePlan(plan);
  // }



  export async function createPlan(userId, payload) {
    const user = await User.findById(userId);
    const product = await Product.findById(payload.productId);
    if (!user || !product) return null;
    console.log("Creating plan with payload:", payload);
    
    const daysMap = {};
    if(payload.mode === "EVERYDAY") {
      for (
        let current = toDateOnly(payload.startDate);
        current <= toDateOnly(payload.endDate);
        current.setDate(current.getDate() + 1)
      ) {
        const normalizedDate = toDateOnly(current);
        const key = toDateKey(normalizedDate);
      
        daysMap[key] = {
          date: normalizedDate,
          quantity: payload.quantity, // replace with actual value
          addressId: payload.addressId || null, // replace if needed
          status: "PENDING",
          delivered: 0
        };
      }
    
    }
    for (const day of payload.days || []) {
      const normalizedDate = toDateOnly(day.date);
      const key = toDateKey(normalizedDate);
      daysMap[key] = {
        date: normalizedDate,
        quantity: day.quantity,
        addressId: day.addressId || null,
        status: "PENDING",
        delivered: 0
      };
    }
  
    const plan = await Plan.create({
      userId,
      productId: payload.productId,
      startDate: toDateOnly(payload.startDate),
      endDate: toDateOnly(payload.endDate),
      mode: payload.mode,
      addressId: payload.addressId || null, // replace if needed
      defaultQuantity: payload.defaultQuantity,
      status: "ACTIVE",
      days: daysMap
    });
  
    // const defaultAddress = getDefaultAddress(user);
    // let planOrderAddressId = null;
    // let planOrderQuantity = 0;
  
    // for (
    //   let current = toDateOnly(payload.startDate);
    //   current <= toDateOnly(payload.endDate);
    //   current = addDays(current, 1)
    // ) {
    //   const key = toDateKey(current);
    //   const override = daysMap[key];
  
    //   const quantity =
    //     payload.mode === "CUSTOM"
    //       ? Number(override?.quantity || 0)
    //       : Number(override?.quantity ? payload.defaultQuantity : 0);
  
    //   const resolvedAddressId = override?.addressId || defaultAddress?._id || null;
    //   if (quantity <= 0 || !resolvedAddressId) continue;
  
    //   if (!planOrderAddressId) {
    //     planOrderAddressId = resolvedAddressId;
    //     planOrderQuantity = quantity;
    //   }
  
    //   await upsertDeliveryRecord({
    //     userId,
    //     addressId: resolvedAddressId,
    //     productId: payload.productId,
    //     planId: plan._id,
    //     date: current,
    //     quantity,
    //     status: "PENDING",
    //     note: ""
    //   });
    // }
  
    // if (planOrderAddressId) {
    //   await createPlanOrder({
    //     userId,
    //     addressId: planOrderAddressId,
    //     planId: plan._id,
    //     date: payload.startDate,
    //     items: [
    //       {
    //         productId: payload.productId,
    //         quantity: planOrderQuantity > 0 ? planOrderQuantity : payload.defaultQuantity || 1
    //       }
    //     ],
    //     note: "Plan created"
    //   });
    // }
    setImmediate(() => {
      createOrdersForPlan(plan._id).catch((err) => {
        console.error("Background order creation failed:", err);
      });
    });
  
    await recalculatePlanStats(plan._id);
    return hydratePlan(plan);
  }

  export async function createOrdersForPlan(planId) {
    const plan = await Plan.findById(planId).lean();
  
    if (!plan) {
      throw new Error("Plan not found");
    }
  
    const days = plan.days || {};
    const dayEntries = Object.values(days);
  
    for (const day of dayEntries) {
      const quantity = Number(day.quantity || 0);
      const addressId = day.addressId || null;
  
      if (quantity <= 0 || !addressId) continue;
  
      await createPlanOrder({
            userId:plan.userId,
            addressId: addressId,
            planId: plan._id,
            date: day.date,
            items: [
              {
                productId: plan.productId,
                quantity: quantity || 1
              }
            ],
            note: "Plan created"
          });
        
    }
  }