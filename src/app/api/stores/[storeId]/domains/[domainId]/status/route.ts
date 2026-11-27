import { resolveCname } from "node:dns/promises";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomDomainProvider } from "@/lib/domains/provider";

export const runtime = "nodejs";

const normaliseDnsName = (value: string) => value.toLowerCase().replace(/\.$/, "");

export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string; domainId: string }> }) {
  const { storeId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores")
    .select("id,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  if (store.owner_user_id !== user.id) return NextResponse.json({ error: "Only the store owner can check this domain." }, { status: 403 });

  const admin = createAdminClient();
  const { data: domain } = await admin.from("store_domains").select("*")
    .eq("id", domainId).eq("store_id", storeId).maybeSingle();
  if (!domain) return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  if (!domain.ssl_provider || !domain.ssl_provider_hostname_id) {
    return NextResponse.json({ error: "SSL provisioning has not started for this domain." }, { status: 409 });
  }

  try {
    const provider = getCustomDomainProvider(domain.ssl_provider);
    const hostname = await provider.get(domain.ssl_provider_hostname_id);
    let dnsTargetMatches = false;
    try {
      const records = await resolveCname(domain.domain);
      dnsTargetMatches = records.some((record) =>
        normaliseDnsName(record) === normaliseDnsName(provider.getCnameTarget())
      );
    } catch {
      dnsTargetMatches = false;
    }

    const sslTerminalFailure = /failed|expired|timed_out|inactive/i.test(hostname.sslStatus);
    const sslStatus = hostname.sslStatus === "active" ? "active" : sslTerminalFailure ? "failed" : "pending";
    const providerHostnameReady = hostname.hostnameStatus === "active";
    const routingStatus = providerHostnameReady && sslStatus === "active" && dnsTargetMatches ? "active" : "pending";
    const sslError = sslTerminalFailure
      ? `The SSL provider reports certificate status: ${hostname.sslStatus}.`
      : null;

    const { error } = await admin.from("store_domains").update({
      ssl_status: sslStatus,
      routing_status: routingStatus,
      ssl_validation_records: [
        ...(hostname.ownershipVerification ? [hostname.ownershipVerification] : []),
        ...hostname.validationRecords,
      ],
      ssl_error: sslError,
      ssl_last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", domainId).eq("store_id", storeId);
    if (error) throw new Error("Could not save the latest domain status.");

    return NextResponse.json({
      hostnameStatus: hostname.hostnameStatus,
      sslStatus,
      routingStatus,
      dnsTargetMatches,
      cnameTarget: provider.getCnameTarget(),
      ready: routingStatus === "active",
      validationRecords: [
        ...(hostname.ownershipVerification ? [hostname.ownershipVerification] : []),
        ...hostname.validationRecords,
      ],
      message: routingStatus === "active"
        ? "Your domain is verified, routed and protected by an active SSL certificate."
        : !dnsTargetMatches
          ? "The CNAME record is not pointing to the Ekhaya target yet. Check your DNS settings and try again."
          : "Your hostname or SSL certificate is still being activated by the provider. Check again shortly.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check domain status.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
