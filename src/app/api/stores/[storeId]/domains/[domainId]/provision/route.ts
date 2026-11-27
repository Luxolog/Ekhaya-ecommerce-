import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomDomainProvider } from "@/lib/domains/provider";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string; domainId: string }> }) {
  const { storeId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores")
    .select("id,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  if (store.owner_user_id !== user.id) return NextResponse.json({ error: "Only the store owner can provision this domain." }, { status: 403 });

  const { data: subscription } = await supabase.from("store_subscriptions")
    .select("plan_code,status").eq("user_id", user.id)
    .in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!subscription) return NextResponse.json({ error: "An active subscription is required." }, { status: 403 });
  const { data: plan } = await supabase.from("plans").select("custom_domain")
    .eq("code", subscription.plan_code).maybeSingle();
  if (!plan?.custom_domain) return NextResponse.json({ error: "Custom domains require a Business or Growth subscription." }, { status: 403 });

  const admin = createAdminClient();
  const { data: domain } = await admin.from("store_domains").select("*")
    .eq("id", domainId).eq("store_id", storeId).maybeSingle();
  if (!domain) return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  if (domain.verification_status !== "verified") {
    return NextResponse.json({ error: "Verify domain ownership before provisioning SSL." }, { status: 409 });
  }

  try {
    const provider = getCustomDomainProvider(domain.ssl_provider || undefined);
    const hostname = await provider.createOrGet(domain.domain);
    const { error } = await admin.from("store_domains").update({
      ssl_provider: provider.name,
      ssl_provider_hostname_id: hostname.id,
      ssl_validation_records: [
        ...(hostname.ownershipVerification ? [hostname.ownershipVerification] : []),
        ...hostname.validationRecords,
      ],
      dns_target: provider.getCnameTarget(),
      ssl_status: hostname.sslStatus === "active" ? "active" : "pending",
      routing_status: "pending",
      ssl_error: null,
      ssl_last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", domainId).eq("store_id", storeId);
    if (error) throw new Error("Provider setup was created but its status could not be saved. Please retry.");

    const dnsRecords = [
      ...(hostname.ownershipVerification ? [hostname.ownershipVerification] : []),
      ...hostname.validationRecords,
    ];
    return NextResponse.json({
      success: true,
      providerHostnameId: hostname.id,
      hostnameStatus: hostname.hostnameStatus,
      sslStatus: hostname.sslStatus,
      cname: { type: "CNAME", name: domain.domain, value: provider.getCnameTarget(), ttl: 3600 },
      dnsRecords,
      note: "Add the CNAME and all provider validation records at your DNS provider. SSL and routing activate only after the provider, certificate and DNS checks all pass.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start SSL provisioning.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
