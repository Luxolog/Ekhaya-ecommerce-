import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { data: store } = await supabase.from("stores").select("id,owner_user_id,status").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found or access denied." }, { status: 404 });
  if (store.owner_user_id !== user.id) return NextResponse.json({ error: "Only the store owner can publish this storefront." }, { status: 403 });

  const { data: subscription } = await supabase.from("store_subscriptions").select("id").eq("user_id", user.id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!subscription) return NextResponse.json({ error: "An active subscription is required to publish your store." }, { status: 403 });

  const nextStatus = store.status === "published" ? "draft" : "published";
  if (nextStatus === "published") {
    const { count, error: countError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "published");
    if (countError) return NextResponse.json({ error: "We could not check your published products." }, { status: 400 });
    if (!count) return NextResponse.json({ error: "Publish at least one product before publishing your storefront." }, { status: 400 });
  }

  const { error } = await supabase.from("stores").update({ status: nextStatus }).eq("id", storeId);
  if (error) return NextResponse.json({ error: "We could not update your storefront status." }, { status: 400 });
  return NextResponse.json({ success: true, status: nextStatus });
}
