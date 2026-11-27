import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomDomainProvider } from "@/lib/domains/provider";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ storeId: string; domainId: string }> }) {
  const { storeId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores")
    .select("id,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  if (store.owner_user_id !== user.id) return NextResponse.json({ error: "Only the store owner can remove this domain." }, { status: 403 });

  const admin = createAdminClient();
  const { data: domain } = await admin.from("store_domains").select("ssl_provider,ssl_provider_hostname_id")
    .eq("id", domainId).eq("store_id", storeId).maybeSingle();
  if (!domain) return NextResponse.json({ error: "Domain not found." }, { status: 404 });

  try {
    if (domain.ssl_provider && domain.ssl_provider_hostname_id) {
      const provider = getCustomDomainProvider(domain.ssl_provider);
      await provider.delete(domain.ssl_provider_hostname_id);
    }
    const { error } = await supabase.from("store_domains").delete()
      .eq("id", domainId).eq("store_id", storeId);
    if (error) return NextResponse.json({ error: "Could not remove this domain." }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove the provider hostname.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
