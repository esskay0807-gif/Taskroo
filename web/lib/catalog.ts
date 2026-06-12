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
