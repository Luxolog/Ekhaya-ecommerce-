import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DomainManager from "./domain-manager";

export default async function StoreDomainsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase.from("stores")
    .select("id,name,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) notFound();

  const [{ data: subscription }, { data: domains }] = await Promise.all([
    supabase.from("store_subscriptions").select("plan_code,status").eq("user_id", store.owner_user_id)
      .in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("store_domains").select("id,domain,verification_token,verification_status,ssl_status,routing_status,ssl_provider,ssl_provider_hostname_id,ssl_validation_records,dns_target,is_primary,verified_at,created_at")
      .eq("store_id", storeId).order("created_at", { ascending: true }),
  ]);
  const { data: plan } = subscription
    ? await supabase.from("plans").select("custom_domain").eq("code", subscription.plan_code).maybeSingle()
    : { data: null };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href={`/dashboard/stores/${storeId}`}>← Store overview</Link>
      </header>
      <section className="dashboard-content domain-settings-page">
        <div className="eyebrow">STORE WORKSPACE / DOMAIN</div>
        <h1>Connect your domain</h1>
        <p className="dashboard-lead">Use a domain you own, registered with any domain provider, for {store.name}.</p>
        {!plan?.custom_domain ? (
          <section className="domain-upgrade-panel">
            <h2>Custom domains are included with Business and Growth</h2>
            <p>Your current plan does not include custom domain connections. Upgrade to connect your own .co.za or .com domain.</p>
            <span className="coming-soon">PLAN UPGRADE AVAILABLE IN BILLING</span>
          </section>
        ) : (
          <>
            <div className="domain-provider-note"><strong>Keep your domain where it is.</strong> You do not need to transfer it to Ekhaya. You remain the domain owner and manage its DNS with your existing provider.</div>
            <DomainManager storeId={storeId} initialDomains={domains ?? []} />
          </>
        )}
      </section>
    </main>
  );
}
