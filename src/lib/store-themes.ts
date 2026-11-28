export type ThemeId = "minimal" | "luxury" | "boutique" | "retail" | "beauty" | "driving" | "insurance" | "household";

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
  heroHeadline?: string;
  heroDescription?: string;
  heroCta?: string;
  heroEyebrow?: string;
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
  {
    id: "driving",
    name: "Driving School",
    category: "Driving lessons & learner support",
    description: "A confident, high-contrast layout for driving schools, lesson packages and learner resources.",
    access: "business",
    preview: { background: "#f5f7f9", surface: "#ffffff", ink: "#172433", accent: "#e5b92e", hero: "#e8edf2" },
    heroHeadline: "Your journey starts here.",
    heroDescription: "Explore driving lessons, instructor-led training and learner resources to help you get road ready.",
    heroCta: "Explore lesson packages",
    heroEyebrow: "DRIVING LESSONS & LEARNER SUPPORT",
  },
  {
    id: "insurance",
    name: "Insurance",
    category: "Insurance & financial protection",
    description: "A reassuring, professional layout for insurance products, cover information and quote enquiries.",
    access: "business",
    preview: { background: "#f3f6fa", surface: "#ffffff", ink: "#142b46", accent: "#2f8c83", hero: "#e2edf0" },
    heroHeadline: "Protection for what matters.",
    heroDescription: "Explore cover options and find clear information to help you make confident protection decisions.",
    heroCta: "Explore cover options",
    heroEyebrow: "COVER THAT MOVES WITH YOU",
  },
  {
    id: "household",
    name: "Household & Essentials",
    category: "Home, kitchen & everyday essentials",
    description: "A warm, practical shopping experience for household products, useful gadgets and everyday finds.",
    access: "business",
    preview: { background: "#faf7f1", surface: "#ffffff", ink: "#302a22", accent: "#a96f42", hero: "#eee3d5" },
    heroHeadline: "Make everyday living easier.",
    heroDescription: "Discover useful home, kitchen and household essentials selected for everyday life.",
    heroCta: "Shop household essentials",
    heroEyebrow: "THOUGHTFUL FINDS FOR YOUR HOME",
  },
];

export function getStoreTheme(id: string | undefined | null) {
  return STORE_THEMES.find((theme) => theme.id === id) ?? STORE_THEMES[0];
}
