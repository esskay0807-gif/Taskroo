/**
 * Front-end catalog of common services per category (TaskRabbit-style guided picker).
 * The backend stays free-form: picking a service just sets the task title + category.
 */

export const CATEGORY_ICONS: Record<string, string> = {
  cleaning: "🧽",
  handyman: "🔧",
  "furniture-assembly": "🪑",
  "moving-delivery": "📦",
  gardening: "🌿",
  painting: "🎨",
  electrical: "💡",
  plumbing: "🚰",
  "appliance-repair": "🛠️",
  tutoring: "📚",
  photography: "📷",
  "web-design": "💻",
};

export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? "✅";
}

export const SERVICES: Record<string, string[]> = {
  cleaning: [
    "Apartment deep clean",
    "Regular home cleaning",
    "Bathroom cleaning",
    "Kitchen cleaning",
    "End-of-lease clean",
    "Window cleaning",
  ],
  handyman: [
    "Mount a TV",
    "Hang shelves or frames",
    "Fix a door",
    "Assemble flat-pack furniture",
    "General home repairs",
    "Install curtains or blinds",
  ],
  "furniture-assembly": [
    "IKEA furniture assembly",
    "Bed assembly",
    "Wardrobe / PAX assembly",
    "Desk assembly",
    "Bookshelf assembly",
    "Office chair assembly",
  ],
  "moving-delivery": [
    "Help moving house",
    "Furniture delivery",
    "Pick up & drop off",
    "Load / unload a van",
    "Move a single item",
    "Junk removal",
  ],
  gardening: [
    "Lawn mowing",
    "Weeding",
    "Hedge trimming",
    "Garden clean-up",
    "Planting",
    "Watering plants",
  ],
  painting: [
    "Paint a room",
    "Exterior painting",
    "Touch-up painting",
    "Wall preparation",
    "Fence painting",
    "Ceiling painting",
  ],
  electrical: [
    "Install a light fixture",
    "Replace switches or sockets",
    "Install a ceiling fan",
    "Fix a wiring issue",
    "Install a chandelier",
    "Set up smart devices",
  ],
  plumbing: [
    "Fix a leaking tap",
    "Unclog a drain",
    "Install a faucet",
    "Toilet repair",
    "Install a sink",
    "Water heater issue",
  ],
  "appliance-repair": [
    "Washing machine repair",
    "Refrigerator repair",
    "Microwave repair",
    "AC service",
    "Dishwasher repair",
    "Oven repair",
  ],
  tutoring: [
    "Maths tutoring",
    "Science tutoring",
    "English / language",
    "Coding lessons",
    "Music lessons",
    "Exam preparation",
  ],
  photography: [
    "Event photography",
    "Portrait shoot",
    "Product photos",
    "Real-estate photos",
    "Photo editing",
    "Videography",
  ],
  "web-design": [
    "Logo design",
    "Landing page",
    "Website build",
    "UI / UX design",
    "Bug fixes",
    "WordPress help",
  ],
};

export function servicesFor(slug: string): string[] {
  return SERVICES[slug] ?? [];
}

/* --- Per-service / per-category detail prompts (TaskRabbit-style) --- */

export type Prompt =
  | { key: string; label: string; type: "select"; options: string[] }
  | { key: string; label: string; type: "text"; placeholder?: string };

// Prompts shared by every service in a category (fallback).
const CATEGORY_PROMPTS: Record<string, Prompt[]> = {
  cleaning: [
    { key: "bedrooms", label: "Bedrooms", type: "select", options: ["Studio", "1", "2", "3", "4+"] },
    { key: "bathrooms", label: "Bathrooms", type: "select", options: ["1", "2", "3+"] },
    { key: "supplies", label: "Cleaning supplies", type: "select", options: ["I'll provide", "Tasker brings"] },
  ],
  handyman: [
    { key: "scope", label: "Size of the job", type: "select", options: ["Quick fix (<1h)", "Half day", "Full day"] },
  ],
  "furniture-assembly": [
    { key: "items", label: "How many items", type: "select", options: ["1", "2", "3", "4+"] },
    { key: "instructions", label: "Have the instructions", type: "select", options: ["Yes", "No"] },
  ],
  "moving-delivery": [
    { key: "size", label: "How much to move", type: "select", options: ["A few items", "Studio", "1 bedroom", "2+ bedrooms"] },
    { key: "access", label: "Access", type: "select", options: ["Ground floor", "Lift available", "Stairs"] },
  ],
  gardening: [
    { key: "size", label: "Garden size", type: "select", options: ["Small", "Medium", "Large"] },
  ],
  painting: [
    { key: "rooms", label: "How many rooms", type: "select", options: ["1", "2", "3+"] },
    { key: "paint", label: "Paint & materials", type: "select", options: ["I'll provide", "Tasker brings"] },
  ],
  electrical: [
    { key: "urgency", label: "How soon", type: "select", options: ["Flexible", "Within a few days", "ASAP"] },
  ],
  plumbing: [
    { key: "urgency", label: "How soon", type: "select", options: ["Flexible", "Within a few days", "ASAP"] },
  ],
  "appliance-repair": [
    { key: "brand", label: "Appliance brand", type: "text", placeholder: "e.g. LG, Samsung, Whirlpool" },
  ],
  tutoring: [
    { key: "level", label: "Level", type: "select", options: ["Primary", "Secondary", "College", "Adult"] },
    { key: "mode", label: "Online or in person", type: "select", options: ["Online", "In person", "Either"] },
  ],
  photography: [
    { key: "duration", label: "How long", type: "select", options: ["1–2 hours", "Half day", "Full day"] },
  ],
  "web-design": [
    { key: "timeline", label: "Timeline", type: "select", options: ["ASAP", "2–4 weeks", "Flexible"] },
  ],
};

// Richer prompts for specific services (override the category fallback).
const SERVICE_PROMPTS: Record<string, Prompt[]> = {
  "Mount a TV": [
    { key: "tv_size", label: "TV size", type: "select", options: ['Up to 43"', '43–55"', '55–65"', '65"+'] },
    { key: "wall", label: "Wall type", type: "select", options: ["Drywall", "Brick", "Concrete", "Not sure"] },
    { key: "mount", label: "Wall mount", type: "select", options: ["I have one", "Tasker brings one"] },
  ],
  "IKEA furniture assembly": [
    { key: "items", label: "How many items", type: "select", options: ["1", "2", "3", "4+"] },
    { key: "instructions", label: "Have the instructions", type: "select", options: ["Yes", "No"] },
  ],
  "Help moving house": [
    { key: "size", label: "Home size", type: "select", options: ["Studio", "1 bedroom", "2 bedrooms", "3+ bedrooms"] },
    { key: "access", label: "Access", type: "select", options: ["Ground floor", "Lift available", "Stairs"] },
    { key: "distance", label: "Distance", type: "select", options: ["Local", "Long distance"] },
  ],
};

export function promptsFor(slug: string | undefined, service: string): Prompt[] {
  if (SERVICE_PROMPTS[service]) return SERVICE_PROMPTS[service];
  if (slug && CATEGORY_PROMPTS[slug]) return CATEGORY_PROMPTS[slug];
  return [];
}
