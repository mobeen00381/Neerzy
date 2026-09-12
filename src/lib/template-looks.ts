/**
 * Lightweight template LOOK metadata — the single source of truth for
 * template names, descriptions and colour palettes/variations.
 *
 * Kept separate from `templates.tsx` on purpose:
 *   • `templates.tsx` imports every template component (heavy, dashboard only)
 *   • the landing page only needs the swatches, so it imports THIS file
 *   • the registry in templates.tsx spreads these entries, so metadata is
 *     never duplicated
 *
 * Palette colours here describe a *customer's* website (trade looks) — they
 * are product content, not Neerzy chrome. See design.md §1 "Device-mockup
 * exception". Every template ships several colour VARIATIONS so a trader can
 * pick the same layout in a different colour.
 */

export type TemplateId =
  | "plumber"
  | "electrician"
  | "hvac"
  | "mechanic"
  | "dentist"
  | "roofing"
  | "handyman"
  | "grocery"
  | "hardware"
  | "generic";

export interface TemplateColorVariation {
  /** Stable id stored with the website (e.g. "forest"). */
  id: string;
  /** Human label shown in the picker. */
  name: string;
  primary: string;
  secondary: string;
}

export interface TemplateLook {
  id: TemplateId;
  name: string;
  description: string;
  /** Default palette — identical to variation id "classic". */
  colorPalette: { primary: string; secondary: string };
  /** Alternate palettes. Always includes the default as "classic". */
  variations: TemplateColorVariation[];
}

export const TEMPLATE_LOOKS: Record<TemplateId, TemplateLook> = {
  plumber: {
    id: "plumber",
    name: "The Plumber Pro",
    description: "Trust-first, emergency-focused design.",
    colorPalette: { primary: "#3B82F6", secondary: "#1E3A8A" },
    variations: [
      { id: "classic", name: "Trust Blue", primary: "#3B82F6", secondary: "#1E3A8A" },
      { id: "forest", name: "Forest", primary: "#0F5132", secondary: "#0A2E22" },
      { id: "copper", name: "Copper", primary: "#C2410C", secondary: "#7C2D12" },
      { id: "midnight", name: "Midnight", primary: "#1E293B", secondary: "#0F172A" },
    ],
  },
  hvac: {
    id: "hvac",
    name: "Arctic HVAC",
    description: "Icy blue to warm orange gradient.",
    colorPalette: { primary: "#4F9CF9", secondary: "#F97316" },
    variations: [
      { id: "classic", name: "Ice & Fire", primary: "#4F9CF9", secondary: "#F97316" },
      { id: "arctic", name: "Arctic", primary: "#38BDF8", secondary: "#0369A1" },
      { id: "sandstone", name: "Sandstone", primary: "#F59E0B", secondary: "#78350F" },
    ],
  },
  electrician: {
    id: "electrician",
    name: "Volt Electric",
    description: "Yellow energetic, dark safety theme.",
    colorPalette: { primary: "#FCD34D", secondary: "#1E293B" },
    variations: [
      { id: "classic", name: "Volt Yellow", primary: "#FCD34D", secondary: "#1E293B" },
      { id: "hazard", name: "Hazard", primary: "#FB923C", secondary: "#7C2D12" },
      { id: "safety", name: "Safety Red", primary: "#F87171", secondary: "#7F1D1D" },
    ],
  },
  roofing: {
    id: "roofing",
    name: "Apex Roofing",
    description: "Earthy red/gray, storm damage ready.",
    colorPalette: { primary: "#EF4444", secondary: "#44403C" },
    variations: [
      { id: "classic", name: "Storm Red", primary: "#EF4444", secondary: "#44403C" },
      { id: "slate", name: "Slate", primary: "#64748B", secondary: "#1E293B" },
      { id: "timber", name: "Timber", primary: "#A16207", secondary: "#44403C" },
    ],
  },
  handyman: {
    id: "handyman",
    name: "Fix-It Handyman",
    description: "Versatile green, card-based layout.",
    colorPalette: { primary: "#10B981", secondary: "#064E3B" },
    variations: [
      { id: "classic", name: "Fix-It Green", primary: "#10B981", secondary: "#064E3B" },
      { id: "ocean", name: "Ocean", primary: "#0EA5E9", secondary: "#0C4A6E" },
      { id: "amber", name: "Amber", primary: "#D97706", secondary: "#78350F" },
    ],
  },
  dentist: {
    id: "dentist",
    name: "Smile Dental",
    description: "Calm mint, elegant family-friendly.",
    colorPalette: { primary: "#14B8A6", secondary: "#042F2E" },
    variations: [
      { id: "classic", name: "Calm Mint", primary: "#14B8A6", secondary: "#042F2E" },
      { id: "sky", name: "Sky Care", primary: "#38BDF8", secondary: "#0C4A6E" },
      { id: "blush", name: "Blush", primary: "#EC4899", secondary: "#831843" },
    ],
  },
  grocery: {
    id: "grocery",
    name: "Fresh Market",
    description: "Vibrant green, farm-fresh product focus.",
    colorPalette: { primary: "#16A34A", secondary: "#14532D" },
    variations: [
      { id: "classic", name: "Fresh Green", primary: "#16A34A", secondary: "#14532D" },
      { id: "citrus", name: "Citrus", primary: "#F59E0B", secondary: "#78350F" },
      { id: "berry", name: "Berry", primary: "#DB2777", secondary: "#831843" },
    ],
  },
  hardware: {
    id: "hardware",
    name: "BuildRight Hardware",
    description: "Industrial orange/black, rugged & bold.",
    colorPalette: { primary: "#F97316", secondary: "#0A0A0A" },
    variations: [
      { id: "classic", name: "Industrial", primary: "#F97316", secondary: "#0A0A0A" },
      { id: "steel", name: "Steel", primary: "#64748B", secondary: "#0F172A" },
      { id: "highvis", name: "High-Vis", primary: "#FACC15", secondary: "#0A0A0A" },
    ],
  },
  mechanic: {
    id: "mechanic",
    name: "Torque Auto",
    description: "Industrial dark theme for auto shops.",
    colorPalette: { primary: "#334155", secondary: "#0F172A" },
    variations: [
      { id: "classic", name: "Torque Slate", primary: "#334155", secondary: "#0F172A" },
      { id: "racing", name: "Racing", primary: "#DC2626", secondary: "#450A0A" },
      { id: "chrome", name: "Chrome", primary: "#0284C7", secondary: "#0C4A6E" },
    ],
  },
  generic: {
    id: "generic",
    name: "Modern Business",
    description: "Flexible fallback for any local service.",
    colorPalette: { primary: "#64748B", secondary: "#1E293B" },
    variations: [
      { id: "classic", name: "Modern Slate", primary: "#64748B", secondary: "#1E293B" },
      { id: "forest", name: "Forest", primary: "#0F5132", secondary: "#0A2E22" },
      { id: "deep-teal", name: "Deep Teal", primary: "#0F766E", secondary: "#134E4A" },
    ],
  },
};

/** All template ids, in display order. */
export const TEMPLATE_IDS: TemplateId[] = Object.keys(TEMPLATE_LOOKS) as TemplateId[];

/** Resolve a variation palette, falling back to the template default. */
export function resolvePalette(
  templateId: string,
  variationId?: string
): { primary: string; secondary: string } {
  const look = TEMPLATE_LOOKS[templateId as TemplateId];
  if (!look) return TEMPLATE_LOOKS.generic.colorPalette;
  if (!variationId || variationId === "classic") return look.colorPalette;
  const found = look.variations.find((v) => v.id === variationId);
  return found ? { primary: found.primary, secondary: found.secondary } : look.colorPalette;
}

/** True when the variation exists on that template. */
export function isValidVariation(templateId: string, variationId: string): boolean {
  const look = TEMPLATE_LOOKS[templateId as TemplateId];
  if (!look) return false;
  return look.variations.some((v) => v.id === variationId);
}
