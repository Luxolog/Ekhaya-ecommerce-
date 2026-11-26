import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORE_THEMES, type ThemeId } from "@/lib/store-themes";
import type { Json } from "@/types/database";

const isHex = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to change your store design." }, { status: 401 });

  const body = await request.json().catch(() => null) as { themeId?: string; appearance?: Record<string, unknown> } | null;
  if (!body || !STORE_THEMES.some((theme) => theme.id === body.themeId)) {
    return NextResponse.json({ error: "Choose a valid storefront theme." }, { status: 400 });
  }

  const { data: store } = await supabase.from("stores").select("id,owner_user_id,settings").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found or you do not have access." }, { status: 404 });

  const { data: subscription } = await supabase.from("store_subscriptions").select("plan_code,status").eq("user_id", store.owner_user_id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!subscription) return NextResponse.json({ error: "An active subscription is required to save a storefront theme." }, { status: 403 });
  const { data: plan } = await supabase.from("plans").select("theme_access,advanced_theme_customization").eq("code", subscription.plan_code).maybeSingle();
  const allowed = (plan?.theme_access ?? ["minimal", "retail"]) as string[];
  if (!allowed.includes(body.themeId)) return NextResponse.json({ error: "This theme is not included in your current plan." }, { status: 403 });

  const incoming = body.appearance ?? {};
  const appearance: Record<string, string> = {};
  if (typeof incoming.headline === "string") appearance.headline = incoming.headline.trim().slice(0, 90);
  if (plan?.advanced_theme_customization) {
    if (isHex(incoming.accent)) appearance.accent = incoming.accent;
    if (isHex(incoming.background)) appearance.background = incoming.background;
    if (isHex(incoming.text)) appearance.text = incoming.text;
  }

  const current = store.settings && typeof store.settings === "object" && !Array.isArray(store.settings) ? store.settings as Record<string, Json> : {};
  const nextSettings = { ...current, storefront: { themeId: body.themeId, appearance } } as Json;
  const { error } = await supabase.from("stores").update({ settings: nextSettings }).eq("id", storeId);
  if (error) return NextResponse.json({ error: "We could not save the design. Please try again." }, { status: 400 });
  return NextResponse.json({ success: true, themeId: body.themeId as ThemeId });
}
