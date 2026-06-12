/**
 * Rough budget suggestion from the guided answers. Heuristic only — a starting point
 * the poster can freely adjust. Amounts are whole INR.
 */

// Base range per category (INR).
const BASE: Record<string, [number, number]> = {
  cleaning: [800, 1800],
  handyman: [500, 1500],
  "furniture-assembly": [600, 1500],
  "moving-delivery": [1000, 2500],
  gardening: [600, 1500],
  painting: [2000, 6000],
  electrical: [500, 1500],
  plumbing: [500, 1500],
  "appliance-repair": [600, 1800],
  tutoring: [400, 1000],
  photography: [3000, 10000],
  "web-design": [3000, 12000],
};

// "Size / quantity" answers — the dominant one scales the range.
const SIZE_MULT: Record<string, number> = {
  Studio: 0.8,
  "1": 1,
  "2": 1.4,
  "3": 1.8,
  "4+": 2.4,
  "1 bedroom": 1,
  "2 bedrooms": 1.6,
  "3+ bedrooms": 2.3,
  "1–3": 1,
  "4–6": 1.6,
  "7+": 2.3,
  "1–5": 1,
  "6–10": 1.7,
  "10+": 2.5,
  "6–20": 1.8,
  "20+": 2.6,
  "1–10": 1,
  "11–50": 1.8,
  "50+": 2.6,
  Small: 0.8,
  Medium: 1.2,
  Large: 1.8,
  "A few items": 0.8,
  "Half a van": 1.5,
  "Full van": 2.3,
  "A few": 0.9,
  Several: 1.3,
  Many: 1.8,
  "1–2 hours": 0.8,
  "Half day": 1.6,
  "Full day": 2.6,
  Group: 1.6,
  "Up to 5": 1,
  "Up to 10m": 1,
  "10–25m": 1.6,
  "25m+": 2.3,
  "Up to 5m": 0.9,
  "5–15m": 1.5,
  "15m+": 2.2,
  "1 wall": 0.7,
  "1 room": 1,
  "Whole home": 2.2,
  "1–2": 1,
  "3–5": 1.6,
  "6+": 2.3,
};

// Additive multipliers (access, urgency, etc.) applied on top of the size scale.
const BUMP: Record<string, number> = {
  Stairs: 1.15,
  "Lift available": 1.05,
  "Long distance": 1.4,
  ASAP: 1.2,
  "Within a few days": 1.05,
  "Multi-storey": 1.4,
  High: 1.2,
};

const round100 = (x: number) => Math.max(100, Math.round(x / 100) * 100);

export interface BudgetSuggestion {
  min: number;
  max: number;
}

export function suggestBudget(
  slug: string | undefined,
  answers: Record<string, string>,
): BudgetSuggestion | null {
  if (!slug || !BASE[slug]) return null;

  const values = Object.values(answers).filter(Boolean);

  // Dominant size/quantity signal.
  const sizeMults = values
    .map((v) => SIZE_MULT[v])
    .filter((x): x is number => x != null);
  let scale = sizeMults.length ? Math.max(...sizeMults) : 1;

  // Access / urgency bumps.
  for (const v of values) if (BUMP[v]) scale *= BUMP[v];

  scale = Math.min(Math.max(scale, 0.7), 3.2);

  const [bmin, bmax] = BASE[slug];
  return { min: round100(bmin * scale), max: round100(bmax * scale) };
}
