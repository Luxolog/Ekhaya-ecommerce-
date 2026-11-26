import { resolveTxt } from "node:dns/promises";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string; domainId: string }> }) {
  const { storeId, domainId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: store } = await supabase.from("stores").select("id")
    .eq("id", storeId).maybeSingle();
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const { data: domain, error: lookupError } = await supabase.from("store_domains")
    .select("id,domain,verification_token,verification_status")
    .eq("id", domainId).eq("store_id", storeId).maybeSingle();
  if (lookupError || !domain) return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  if (domain.verification_status === "verified") {
    return NextResponse.json({ verified: true, status: domain.verification_status });
  }

  const recordName = `_ekhaya-verification.${domain.domain}`;
  try {
    const records = await resolveTxt(recordName);
    const expected = `ekhaya-verification=${domain.verification_token}`;
    const found = records.some((chunks) => chunks.join("") === expected);
    if (!found) return NextResponse.json({
      verified: false,
      error: "We could not find the verification TXT record yet. Check the host and value, then allow time for DNS propagation."
    }, { status: 400 });

    const { error: updateError } = await supabase.from("store_domains").update({
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", domainId).eq("store_id", storeId);
    if (updateError) return NextResponse.json({ error: "DNS was found, but we could not save verification. Please retry." }, { status: 400 });
    return NextResponse.json({ verified: true, status: "verified", note: "Ownership confirmed. Store routing and SSL activation are not enabled yet." });
  } catch {
    return NextResponse.json({
      verified: false,
      error: "DNS lookup could not find the TXT record yet. Confirm the record and try again after propagation."
    }, { status: 400 });
  }
}
