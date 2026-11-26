import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeCustomDomain } from "@/lib/domains";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores").select("id").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const { data, error } = await supabase.from("store_domains")
    .select("id,domain,verification_status,is_primary,verified_at,created_at")
    .eq("store_id", storeId).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load domains." }, { status: 400 });
  return NextResponse.json({ domains: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores")
    .select("id,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  if (store.owner_user_id !== user.id) return NextResponse.json({ error: "Only the store owner can manage its domain." }, { status: 403 });

  const { data: subscription } = await supabase.from("store_subscriptions")
    .select("plan_code,status").eq("user_id", user.id)
    .in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!subscription) return NextResponse.json({ error: "An active subscription is required." }, { status: 403 });

  const { data: plan } = await supabase.from("plans").select("custom_domain")
    .eq("code", subscription.plan_code).maybeSingle();
  if (!plan?.custom_domain) return NextResponse.json({
    error: "Custom domains are available on Business and Growth plans. Upgrade your subscription to continue."
  }, { status: 403 });

  const body = await request.json().catch(() => null) as { domain?: unknown } | null;
  const domain = normalizeCustomDomain(body?.domain);
  if (!domain) return NextResponse.json({
    error: "Enter a valid domain name, such as shop.example.co.za, without https:// or a path."
  }, { status: 400 });

  const { count } = await supabase.from("store_domains")
    .select("id", { count: "exact", head: true }).eq("store_id", storeId);
  if ((count ?? 0) >= 1) return NextResponse.json({
    error: "One custom domain is currently included per store. Remove the existing domain before adding another."
  }, { status: 409 });

  const token = randomBytes(24).toString("hex");
  const { data, error } = await supabase.from("store_domains").insert({
    store_id: storeId,
    domain,
    verification_token: token,
    verification_status: "pending",
    is_primary: true,
  }).select("id,domain,verification_status,is_primary,verified_at,created_at").single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This domain is already connected to another store or account." }, { status: 409 });
    return NextResponse.json({ error: "Could not save this domain. Please try again." }, { status: 400 });
  }

  return NextResponse.json({
    domain: data,
    dns: { type: "TXT", host: "_ekhaya-verification", fqdn: `_ekhaya-verification.${domain}`, value: `ekhaya-verification=${token}`, ttl: 3600 },
    note: "This TXT record proves domain ownership. Store routing and SSL activation are a separate step after verification."
  }, { status: 201 });
}
