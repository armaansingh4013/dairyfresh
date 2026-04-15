import { scheduleTodaysPlacedOrders } from "./orders.service.js";
import { toDateKey } from "../utils/date.js";

const TRIGGER_HOUR = 1;
const TRIGGER_MINUTE = 0;

let schedulerTimeout = null;
let lastProcessedDateKey = null;

function getNextTriggerTime(now = new Date()) {
  const next = new Date(now);
  next.setHours(TRIGGER_HOUR, TRIGGER_MINUTE, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

async function processTodaysOrders(reason, now = new Date()) {
  const dateKey = toDateKey(now);

  if (lastProcessedDateKey === dateKey) {
    return;
  }

  const result = await scheduleTodaysPlacedOrders(now);
  lastProcessedDateKey = dateKey;
  console.log(
    `[order-scheduler] ${reason} processed ${result.modifiedCount}/${result.matchedCount} orders for ${result.dateKey}`
  );
}

async function runScheduledTick() {
  try {
    await processTodaysOrders("daily-trigger");
  } catch (error) {
    console.error("[order-scheduler] failed to process daily trigger", error);
  } finally {
    const nextTrigger = getNextTriggerTime();
    const delay = Math.max(1000, nextTrigger.getTime() - Date.now());
    schedulerTimeout = setTimeout(runScheduledTick, delay);
  }
}

export async function startOrderScheduler() {
  const now = new Date();

  if (now.getHours() > TRIGGER_HOUR || (now.getHours() === TRIGGER_HOUR && now.getMinutes() >= TRIGGER_MINUTE)) {
    try {
      await processTodaysOrders("startup-catchup", now);
    } catch (error) {
      console.error("[order-scheduler] failed during startup catchup", error);
    }
  }

  const nextTrigger = getNextTriggerTime(now);
  const delay = Math.max(1000, nextTrigger.getTime() - now.getTime());
  schedulerTimeout = setTimeout(runScheduledTick, delay);
  console.log(`[order-scheduler] next run at ${nextTrigger.toISOString()}`);
}

export function stopOrderScheduler() {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
}
