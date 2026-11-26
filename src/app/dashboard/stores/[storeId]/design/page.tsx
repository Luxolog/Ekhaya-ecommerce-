import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ThemeStudio from "./theme-studio";
import { createClient } from "@/lib/supabase/server";
import { STORE_THEMES, type ThemeId } from "@/lib/store-themes";

type Settings = { storefront?: { themeId?: string; appearance?: { accent?: string; background?: string; text?: string; headline?: string } } };

export default async function StoreDesignPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase.from("stores").select("id,name,owner_user_id,settings").eq("id", storeId).maybeSingle();
  if (!store) notFound();

  const { data: subscription } = await supabase.from("store_subscriptions").select("plan_code,status").eq("user_id", store.owner_user_id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: plan } = subscription
    ? await supabase.from("plans").select("theme_access,advanced_theme_customization").eq("code", subscription.plan_code).maybeSingle()
    : { data: null };

  const settings = (store.settings && typeof store.settings === "object" && !Array.isArray(store.settings) ? store.settings : {}) as Settings;
  const storefront = settings.storefront ?? {};
  const allowedThemes = (plan?.theme_access ?? ["minimal", "retail"]) as ThemeId[];
  const selectedTheme = allowedThemes.includes(storefront.themeId as ThemeId) ? storefront.themeId as ThemeId : allowedThemes[0] ?? "minimal";

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href={`/dashboard/stores/${storeId}`}>← Store overview</Link>
      </header>
      <section className="dashboard-content theme-studio-page">
        <div className="eyebrow">STORE WORKSPACE / DESIGN</div>
        <h1>Store design</h1>
        <p className="dashboard-lead">Choose and customise the storefront for {store.name}.</p>
        <div className="theme-plan-note"><strong>{subscription?.plan_code?.toUpperCase() ?? "STARTER"} PLAN</strong><span>{STORE_THEMES.filter((theme) => allowedThemes.includes(theme.id)).length} themes available on your plan</span></div>
        <ThemeStudio storeId={storeId} initialTheme={selectedTheme} initialAppearance={storefront.appearance ?? {}} allowedThemes={allowedThemes} advancedCustomization={plan?.advanced_theme_customization ?? false} />
      </section>
    </main>
  );
}
