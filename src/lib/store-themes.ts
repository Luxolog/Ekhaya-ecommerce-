export type ThemeId = "minimal" | "luxury" | "boutique" | "retail" | "beauty";

export type StoreTheme = {
  id: ThemeId;
  name: string;
  category: string;
  description: string;
  access: "starter" | "business";
  preview: {
    background: string;
    surface: string;
    ink: string;
    accent: string;
    hero: string;
  };
};

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "minimal",
    name: "Minimal",
    category: "Modern essentials",
    description: "A clean, spacious storefront that puts products first.",
    access: "starter",
    preview: { background: "#f7f6f1", surface: "#ffffff", ink: "#1d2923", accent: "#315a43", hero: "#e7eadf" },
  },
  {
    id: "retail",
    name: "Everyday Retail",
    category: "General retail",
    description: "A practical catalogue layout with clear prices and product discovery.",
    access: "starter",
    preview: { background: "#f4f6f8", surface: "#ffffff", ink: "#182433", accent: "#245b9a", hero: "#e3edf7" },
  },
  {
    id: "luxury",
    name: "Luxury",
    category: "Premium brands",
    description: "Editorial typography, rich contrast and a refined shopping experience.",
    access: "business",
    preview: { background: "#171714", surface: "#24231f", ink: "#f4efe4", accent: "#c8a96b", hero: "#39352b" },
  },
  {
    id: "boutique",
    name: "Fashion Boutique",
    category: "Fashion & accessories",
    description: "Large campaign imagery and expressive product collections.",
    access: "business",
    preview: { background: "#faf4f0", surface: "#ffffff", ink: "#30221f", accent: "#a85d50", hero: "#ead8d0" },
  },
  {
    id: "beauty",
    name: "Beauty & Lifestyle",
    category: "Beauty & wellness",
    description: "Soft tones and calm layouts for beauty and lifestyle products.",
    access: "business",
    preview: { background: "#fbf5f5", surface: "#ffffff", ink: "#382b31", accent: "#ad718b", hero: "#f0dfe6" },
  },
];

export function getStoreTheme(id: string | undefined | null) {
  return STORE_THEMES.find((theme) => theme.id === id) ?? STORE_THEMES[0];
}
