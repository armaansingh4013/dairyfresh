export function formatCurrency(amount) {
  return `INR ${Math.round(amount).toLocaleString("en-IN")}`;
}
