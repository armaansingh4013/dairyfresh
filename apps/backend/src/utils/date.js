export function startOfDay(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  export function endOfDay(d) {
    const date = new Date(d);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  
  export function addDays(d, days) {
    const date = new Date(d);
    date.setDate(date.getDate() + days);
    return date;
  }
  
  export function toDateOnly(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  export function toDateKey(d) {
    return toDateOnly(d).toISOString().split("T")[0];
  }
  
  export function sameDate(left, right) {
    return toDateOnly(left).getTime() === toDateOnly(right).getTime();
  }