import type { CSSProperties } from "react";
import type { Json, Tables } from "@/types/database";
import { getStoreTheme, type ThemeId } from "@/lib/store-themes";

export type PublicStore = Tables<"storefront_stores">;
export type PublicProduct = Tables<"storefront_products">;
export type PublicImage = Tables<"storefront_product_images">;
export type PublicCollection = Tables<"storefront_collections">;

export type StorefrontAppearance = {
  accent?: string;
  background?: string;
  text?: string;
  headline?: string;
};

const isHex = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

export function getStorefrontStyle(store: PublicStore): CSSProperties {
  const theme = getStoreTheme(store.storefront_theme_id);
  const raw = store.storefront_appearance as StorefrontAppearance | Json;
  const appearance = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as StorefrontAppearance
    : {};
  return {
    "--sf-bg": isHex(appearance.background) ? appearance.background : theme.preview.background,
    "--sf-surface": theme.preview.surface,
    "--sf-ink": isHex(appearance.text) ? appearance.text : theme.preview.ink,
    "--sf-accent": isHex(appearance.accent) ? appearance.accent : theme.preview.accent,
  } as CSSProperties;
}

export function getStorefrontHeadline(store: PublicStore) {
  const raw = store.storefront_appearance as StorefrontAppearance | Json;
  const appearance = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as StorefrontAppearance
    : {};
  return typeof appearance.headline === "string" && appearance.headline.trim()
    ? appearance.headline.trim()
    : getStoreTheme(store.storefront_theme_id).heroHeadline ?? `Welcome to ${store.name}`;
}

export function formatStorePrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: currency || "ZAR" }).format(price);
  } catch {
    return `R ${Number(price).toFixed(2)}`;
  }
}

export function getThemeName(id: string) {
  return getStoreTheme(id as ThemeId).name;
}
