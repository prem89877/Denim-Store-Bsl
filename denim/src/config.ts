/* ---------- EDIT YOUR CLIENT'S DETAILS HERE ---------- */
export const PHONE = "9604627267";
export const ADDRESS = "Railway Station Rd, Gandhi Nagar, Kanhaya Kunj, Bhusawal, Maharashtra 425201";
export const MAPS = "https://maps.app.goo.gl/bSU9DcLPc1RsPQi4A";

/* WhatsApp number (with country code, no +) used for the optional "also send on WhatsApp" button */
export const WHATSAPP = `91${PHONE}`;

/* Admin passcode used ONLY in demo (local) mode, when Supabase keys are not set.
   With Supabase, the admin logs in with email + password instead. */
export const DEMO_ADMIN_PASSCODE = "denim123";

export const CATEGORIES = ["Jeans", "Shirts and tees", "Jackets", "Kids wear", "Accessories", "Other"];
export const SIZE_PRESETS = ["S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "40", "Free size"];

/* quick colour options for the admin product form (admin can also add any custom colour) */
export const COLOUR_PRESETS = [
  { name: "Indigo", hex: "#1F3A6E" },
  { name: "Light blue", hex: "#7FA6D4" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "Grey", hex: "#8A8F98" },
  { name: "White", hex: "#F5F5F5" },
  { name: "Khaki", hex: "#B9A57A" },
];

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_COLOUR_IMAGES = 5;
