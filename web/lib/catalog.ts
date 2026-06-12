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

// Bespoke prompts per specific service (override the category fallback).
const SERVICE_PROMPTS: Record<string, Prompt[]> = {
  // Cleaning
  "Apartment deep clean": [
    { key: "bedrooms", label: "Bedrooms", type: "select", options: ["Studio", "1", "2", "3", "4+"] },
    { key: "bathrooms", label: "Bathrooms", type: "select", options: ["1", "2", "3+"] },
    { key: "supplies", label: "Cleaning supplies", type: "select", options: ["I'll provide", "Tasker brings"] },
  ],
  "Regular home cleaning": [
    { key: "bedrooms", label: "Bedrooms", type: "select", options: ["Studio", "1", "2", "3", "4+"] },
    { key: "frequency", label: "How often", type: "select", options: ["One-off", "Weekly", "Fortnightly", "Monthly"] },
    { key: "supplies", label: "Cleaning supplies", type: "select", options: ["I'll provide", "Tasker brings"] },
  ],
  "Bathroom cleaning": [
    { key: "count", label: "How many bathrooms", type: "select", options: ["1", "2", "3+"] },
    { key: "condition", label: "Condition", type: "select", options: ["Light", "Moderate", "Heavy"] },
  ],
  "Kitchen cleaning": [
    { key: "size", label: "Kitchen size", type: "select", options: ["Small", "Medium", "Large"] },
    { key: "oven", label: "Include oven", type: "select", options: ["Yes", "No"] },
  ],
  "End-of-lease clean": [
    { key: "bedrooms", label: "Bedrooms", type: "select", options: ["Studio", "1", "2", "3", "4+"] },
    { key: "bathrooms", label: "Bathrooms", type: "select", options: ["1", "2", "3+"] },
    { key: "carpet", label: "Carpet steam clean", type: "select", options: ["Include", "Not needed"] },
  ],
  "Window cleaning": [
    { key: "windows", label: "How many windows", type: "select", options: ["1–5", "6–10", "10+"] },
    { key: "side", label: "Which side", type: "select", options: ["Inside", "Outside", "Both"] },
    { key: "storeys", label: "Storeys", type: "select", options: ["Single", "Multi-storey"] },
  ],

  // Handyman
  "Mount a TV": [
    { key: "tv_size", label: "TV size", type: "select", options: ['Up to 43"', '43–55"', '55–65"', '65"+'] },
    { key: "wall", label: "Wall type", type: "select", options: ["Drywall", "Brick", "Concrete", "Not sure"] },
    { key: "mount", label: "Wall mount", type: "select", options: ["I have one", "Tasker brings one"] },
  ],
  "Hang shelves or frames": [
    { key: "count", label: "How many", type: "select", options: ["1–3", "4–6", "7+"] },
    { key: "wall", label: "Wall type", type: "select", options: ["Drywall", "Brick", "Concrete", "Not sure"] },
  ],
  "Fix a door": [
    { key: "issue", label: "What's wrong", type: "select", options: ["Won't close", "Squeaks", "Lock", "Hinges", "Other"] },
    { key: "count", label: "How many doors", type: "select", options: ["1", "2", "3+"] },
  ],
  "Assemble flat-pack furniture": [
    { key: "items", label: "How many items", type: "select", options: ["1", "2", "3", "4+"] },
    { key: "instructions", label: "Have the instructions", type: "select", options: ["Yes", "No"] },
  ],
  "General home repairs": [
    { key: "scope", label: "Size of the job", type: "select", options: ["Quick fix (<1h)", "Half day", "Full day"] },
    { key: "tools", label: "Tools", type: "select", options: ["I have tools", "Tasker brings"] },
  ],
  "Install curtains or blinds": [
    { key: "windows", label: "How many windows", type: "select", options: ["1", "2", "3", "4+"] },
    { key: "hardware", label: "Rods / brackets", type: "select", options: ["I have them", "Need supplied"] },
  ],

  // Furniture assembly
  "IKEA furniture assembly": [
    { key: "items", label: "How many items", type: "select", options: ["1", "2", "3", "4+"] },
    { key: "instructions", label: "Have the instructions", type: "select", options: ["Yes", "No"] },
  ],
  "Bed assembly": [
    { key: "size", label: "Bed size", type: "select", options: ["Single", "Double", "Queen", "King"] },
    { key: "storage", label: "Storage drawers", type: "select", options: ["Yes", "No"] },
  ],
  "Wardrobe / PAX assembly": [
    { key: "doors", label: "How many doors", type: "select", options: ["2", "3", "4+"] },
    { key: "type", label: "Door type", type: "select", options: ["Sliding", "Hinged"] },
  ],
  "Desk assembly": [
    { key: "items", label: "How many", type: "select", options: ["1", "2", "3+"] },
    { key: "type", label: "Desk type", type: "select", options: ["Standard", "Standing", "Corner"] },
  ],
  "Bookshelf assembly": [
    { key: "items", label: "How many", type: "select", options: ["1", "2", "3+"] },
    { key: "height", label: "Height", type: "select", options: ["Short", "Tall"] },
  ],
  "Office chair assembly": [
    { key: "items", label: "How many chairs", type: "select", options: ["1", "2", "3+"] },
  ],

  // Moving & delivery
  "Help moving house": [
    { key: "size", label: "Home size", type: "select", options: ["Studio", "1 bedroom", "2 bedrooms", "3+ bedrooms"] },
    { key: "access", label: "Access", type: "select", options: ["Ground floor", "Lift available", "Stairs"] },
    { key: "distance", label: "Distance", type: "select", options: ["Local", "Long distance"] },
  ],
  "Furniture delivery": [
    { key: "items", label: "How many items", type: "select", options: ["1", "2", "3+"] },
    { key: "access", label: "Access", type: "select", options: ["Ground floor", "Lift available", "Stairs"] },
  ],
  "Pick up & drop off": [
    { key: "item_size", label: "Item size", type: "select", options: ["Small", "Medium", "Large"] },
    { key: "distance", label: "Distance", type: "select", options: ["Local", "Long distance"] },
  ],
  "Load / unload a van": [
    { key: "which", label: "Load or unload", type: "select", options: ["Load", "Unload", "Both"] },
    { key: "helpers", label: "Helpers needed", type: "select", options: ["1", "2", "3+"] },
  ],
  "Move a single item": [
    { key: "item", label: "What is it", type: "text", placeholder: "e.g. sofa, fridge, piano" },
    { key: "access", label: "Access", type: "select", options: ["Ground floor", "Lift available", "Stairs"] },
  ],
  "Junk removal": [
    { key: "amount", label: "How much", type: "select", options: ["A few items", "Half a van", "Full van"] },
    { key: "heavy", label: "Heavy items", type: "select", options: ["Yes", "No"] },
  ],

  // Gardening
  "Lawn mowing": [
    { key: "size", label: "Lawn size", type: "select", options: ["Small", "Medium", "Large"] },
    { key: "mower", label: "Mower", type: "select", options: ["I have one", "Tasker brings"] },
  ],
  Weeding: [
    { key: "area", label: "Area", type: "select", options: ["Small bed", "Medium", "Whole garden"] },
  ],
  "Hedge trimming": [
    { key: "length", label: "Hedge length", type: "select", options: ["Up to 5m", "5–15m", "15m+"] },
    { key: "height", label: "Height", type: "select", options: ["Low", "Medium", "Tall"] },
  ],
  "Garden clean-up": [
    { key: "size", label: "Garden size", type: "select", options: ["Small", "Medium", "Large"] },
    { key: "waste", label: "Green waste", type: "select", options: ["Tasker removes", "I'll keep it"] },
  ],
  Planting: [
    { key: "what", label: "What to plant", type: "text", placeholder: "e.g. shrubs, flowers, veg" },
    { key: "qty", label: "How many", type: "select", options: ["A few", "Several", "Many"] },
  ],
  "Watering plants": [
    { key: "frequency", label: "How often", type: "select", options: ["One-off", "Weekly", "While away"] },
    { key: "plants", label: "How many plants", type: "select", options: ["Few", "Many"] },
  ],

  // Painting
  "Paint a room": [
    { key: "rooms", label: "How many rooms", type: "select", options: ["1", "2", "3+"] },
    { key: "paint", label: "Paint & materials", type: "select", options: ["I'll provide", "Tasker brings"] },
    { key: "coats", label: "Coats", type: "select", options: ["1", "2"] },
  ],
  "Exterior painting": [
    { key: "size", label: "Area size", type: "select", options: ["Small", "Medium", "Large"] },
    { key: "storeys", label: "Storeys", type: "select", options: ["Single", "Multi-storey"] },
  ],
  "Touch-up painting": [
    { key: "spots", label: "How many spots", type: "select", options: ["A few", "Several", "Many"] },
  ],
  "Wall preparation": [
    { key: "area", label: "Area", type: "select", options: ["1 wall", "1 room", "Whole home"] },
    { key: "work", label: "Work needed", type: "select", options: ["Filling", "Sanding", "Both"] },
  ],
  "Fence painting": [
    { key: "length", label: "Fence length", type: "select", options: ["Up to 10m", "10–25m", "25m+"] },
    { key: "sides", label: "Sides", type: "select", options: ["One side", "Both"] },
  ],
  "Ceiling painting": [
    { key: "rooms", label: "How many rooms", type: "select", options: ["1", "2", "3+"] },
    { key: "height", label: "Ceiling", type: "select", options: ["Standard", "High"] },
  ],

  // Electrical
  "Install a light fixture": [
    { key: "count", label: "How many", type: "select", options: ["1", "2", "3+"] },
    { key: "wiring", label: "Wiring", type: "select", options: ["Existing", "New wiring needed"] },
  ],
  "Replace switches or sockets": [
    { key: "count", label: "How many", type: "select", options: ["1–3", "4–6", "7+"] },
  ],
  "Install a ceiling fan": [
    { key: "count", label: "How many", type: "select", options: ["1", "2", "3+"] },
    { key: "existing", label: "Existing fitting", type: "select", options: ["Replacing old", "New install"] },
  ],
  "Fix a wiring issue": [
    { key: "issue", label: "Describe the issue", type: "text", placeholder: "e.g. socket not working" },
    { key: "urgency", label: "How soon", type: "select", options: ["Flexible", "Within a few days", "ASAP"] },
  ],
  "Install a chandelier": [
    { key: "ceiling", label: "Ceiling height", type: "select", options: ["Standard", "High"] },
    { key: "existing", label: "Existing fitting", type: "select", options: ["Replacing", "New"] },
  ],
  "Set up smart devices": [
    { key: "devices", label: "Which devices", type: "text", placeholder: "e.g. lights, doorbell, plugs" },
    { key: "count", label: "How many", type: "select", options: ["1–2", "3–5", "6+"] },
  ],

  // Plumbing
  "Fix a leaking tap": [
    { key: "where", label: "Where", type: "select", options: ["Kitchen", "Bathroom", "Other"] },
    { key: "count", label: "How many taps", type: "select", options: ["1", "2", "3+"] },
  ],
  "Unclog a drain": [
    { key: "where", label: "Where", type: "select", options: ["Sink", "Shower", "Toilet", "Outdoor"] },
    { key: "severity", label: "How blocked", type: "select", options: ["Slow", "Fully blocked"] },
  ],
  "Install a faucet": [
    { key: "have", label: "Faucet", type: "select", options: ["I have it", "Need supplied"] },
    { key: "where", label: "Where", type: "select", options: ["Kitchen", "Bathroom"] },
  ],
  "Toilet repair": [
    { key: "issue", label: "What's wrong", type: "select", options: ["Won't flush", "Leaking", "Running", "Other"] },
  ],
  "Install a sink": [
    { key: "where", label: "Where", type: "select", options: ["Kitchen", "Bathroom", "Laundry"] },
    { key: "have", label: "Sink", type: "select", options: ["I have it", "Need supplied"] },
  ],
  "Water heater issue": [
    { key: "issue", label: "Issue", type: "select", options: ["No hot water", "Leaking", "Install new"] },
    { key: "type", label: "Type", type: "select", options: ["Electric", "Gas", "Not sure"] },
  ],

  // Appliance repair
  "Washing machine repair": [
    { key: "brand", label: "Brand", type: "text", placeholder: "e.g. LG, Samsung" },
    { key: "issue", label: "Issue", type: "select", options: ["Won't start", "Not draining", "Leaking", "Noisy", "Other"] },
  ],
  "Refrigerator repair": [
    { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Whirlpool, Samsung" },
    { key: "issue", label: "Issue", type: "select", options: ["Not cooling", "Leaking", "Noisy", "Other"] },
  ],
  "Microwave repair": [
    { key: "brand", label: "Brand", type: "text", placeholder: "e.g. IFB, Panasonic" },
    { key: "issue", label: "Issue", type: "select", options: ["Won't heat", "No power", "Other"] },
  ],
  "AC service": [
    { key: "type", label: "AC type", type: "select", options: ["Split", "Window", "Central"] },
    { key: "service", label: "Service", type: "select", options: ["Clean / service", "Repair", "Install"] },
  ],
  "Dishwasher repair": [
    { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Bosch, LG" },
    { key: "issue", label: "Issue", type: "select", options: ["Not draining", "Not cleaning", "Leaking", "Other"] },
  ],
  "Oven repair": [
    { key: "type", label: "Type", type: "select", options: ["Electric", "Gas"] },
    { key: "issue", label: "Issue", type: "select", options: ["Won't heat", "Uneven heat", "Other"] },
  ],

  // Tutoring
  "Maths tutoring": [
    { key: "level", label: "Level", type: "select", options: ["Primary", "Secondary", "College", "Adult"] },
    { key: "mode", label: "Online or in person", type: "select", options: ["Online", "In person", "Either"] },
  ],
  "Science tutoring": [
    { key: "subject", label: "Subject", type: "select", options: ["Physics", "Chemistry", "Biology", "General"] },
    { key: "level", label: "Level", type: "select", options: ["Primary", "Secondary", "College"] },
  ],
  "English / language": [
    { key: "focus", label: "Focus", type: "select", options: ["Reading", "Writing", "Speaking", "Exam"] },
    { key: "mode", label: "Online or in person", type: "select", options: ["Online", "In person", "Either"] },
  ],
  "Coding lessons": [
    { key: "topic", label: "Topic", type: "text", placeholder: "e.g. Python, web dev" },
    { key: "level", label: "Level", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
  ],
  "Music lessons": [
    { key: "instrument", label: "Instrument", type: "text", placeholder: "e.g. guitar, piano" },
    { key: "level", label: "Level", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
  ],
  "Exam preparation": [
    { key: "exam", label: "Which exam", type: "text", placeholder: "e.g. JEE, IELTS" },
    { key: "mode", label: "Online or in person", type: "select", options: ["Online", "In person", "Either"] },
  ],

  // Photography
  "Event photography": [
    { key: "event", label: "Event type", type: "text", placeholder: "e.g. birthday, wedding" },
    { key: "duration", label: "How long", type: "select", options: ["1–2 hours", "Half day", "Full day"] },
  ],
  "Portrait shoot": [
    { key: "people", label: "How many people", type: "select", options: ["1", "2", "Group"] },
    { key: "location", label: "Location", type: "select", options: ["Studio", "Outdoor", "My place"] },
  ],
  "Product photos": [
    { key: "items", label: "How many products", type: "select", options: ["1–5", "6–20", "20+"] },
    { key: "style", label: "Style", type: "select", options: ["White background", "Lifestyle", "Either"] },
  ],
  "Real-estate photos": [
    { key: "property", label: "Property", type: "select", options: ["Apartment", "House", "Commercial"] },
    { key: "rooms", label: "Rooms", type: "select", options: ["Up to 5", "6–10", "10+"] },
  ],
  "Photo editing": [
    { key: "count", label: "How many photos", type: "select", options: ["1–10", "11–50", "50+"] },
    { key: "turnaround", label: "Turnaround", type: "select", options: ["Standard", "Rush"] },
  ],
  Videography: [
    { key: "type", label: "Video type", type: "select", options: ["Event", "Promo", "Social"] },
    { key: "duration", label: "How long", type: "select", options: ["Half day", "Full day"] },
  ],

  // Web & design
  "Logo design": [
    { key: "style", label: "Style refs", type: "text", placeholder: "e.g. minimal, playful" },
    { key: "concepts", label: "Concepts", type: "select", options: ["1", "2–3", "Several"] },
  ],
  "Landing page": [
    { key: "purpose", label: "What's it for", type: "text", placeholder: "e.g. product launch" },
    { key: "copy", label: "Copy", type: "select", options: ["I'll provide", "Need help"] },
  ],
  "Website build": [
    { key: "pages", label: "How many pages", type: "select", options: ["1–3", "4–8", "9+"] },
    { key: "platform", label: "Platform", type: "select", options: ["No preference", "WordPress", "Webflow", "Custom"] },
  ],
  "UI / UX design": [
    { key: "scope", label: "App or site", type: "text", placeholder: "e.g. mobile app, dashboard" },
    { key: "screens", label: "Screens", type: "select", options: ["1–5", "6–15", "16+"] },
  ],
  "Bug fixes": [
    { key: "stack", label: "Tech stack", type: "text", placeholder: "e.g. React, WordPress" },
    { key: "urgency", label: "How soon", type: "select", options: ["Flexible", "Within a few days", "ASAP"] },
  ],
  "WordPress help": [
    { key: "task", label: "What you need", type: "text", placeholder: "e.g. fix layout, add plugin" },
    { key: "urgency", label: "How soon", type: "select", options: ["Flexible", "Within a few days", "ASAP"] },
  ],
};

export function promptsFor(slug: string | undefined, service: string): Prompt[] {
  if (SERVICE_PROMPTS[service]) return SERVICE_PROMPTS[service];
  if (slug && CATEGORY_PROMPTS[slug]) return CATEGORY_PROMPTS[slug];
  return [];
}
