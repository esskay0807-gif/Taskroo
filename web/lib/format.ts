/** Format a whole-rupee amount as INR, e.g. 1500 -> "₹1,500". */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a task budget range, collapsing equal min/max. */
export function formatBudget(min: number, max: number): string {
  return min === max ? formatInr(min) : `${formatInr(min)} – ${formatInr(max)}`;
}
