export function toDateString(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function datesBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = [];

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return days;
  }

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return days;
}
