import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ storeId: string; domainId: string }> }) {
  const { storeId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores").select("id")
    .eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const { error } = await supabase.from("store_domains").delete()
    .eq("id", domainId).eq("store_id", storeId);
  if (error) return NextResponse.json({ error: "Could not remove this domain." }, { status: 400 });
  return NextResponse.json({ success: true });
}
