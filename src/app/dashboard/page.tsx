import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect("/login");

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const [{ data: profile }, { data: stores }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("stores").select("id,name,slug,status,created_at").eq("owner_user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("store_subscriptions").select("plan_code,status,current_period_end").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <form action="/auth/signout" method="post"><button className="signout-button">Sign out ↗</button></form>
      </header>
      <section className="dashboard-content">
        <div className="eyebrow">YOUR BUSINESS WORKSPACE</div>
        <h1>Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="dashboard-lead">This is where your online business comes together.</p>
        <div className="dashboard-summary">
          <article><span>YOUR PLAN</span><strong>{subscription?.plan_code ? subscription.plan_code.toUpperCase() : "Not selected"}</strong><small>{subscription?.status ?? "Choose a plan to get started"}</small></article>
          <article><span>YOUR STORES</span><strong>{stores?.length ?? 0}</strong><small>Stores in your workspace</small></article>
          <article><span>ACCOUNT</span><strong>Verified</strong><small>{user.email}</small></article>
        </div>
        <div className="dashboard-section-title"><div><div className="eyebrow">YOUR STOREFRONTS</div><h2>Stores you manage</h2></div><Link className="button button-primary" href="/dashboard/stores/new">Create a store <span>→</span></Link></div>
        {stores?.length ? <div className="store-list">{stores.map((store) => <Link className="store-row" href={`/dashboard/stores/${store.id}`} key={store.id}><div><strong>{store.name}</strong><small>ekhaya store / {store.slug}</small></div><span className={`status-pill status-${store.status}`}>{store.status}</span><span>→</span></Link>)}</div> : <div className="empty-state"><div className="empty-icon">E</div><h3>Your first store starts here.</h3><p>Choose a plan, set up your store identity and add your first products.</p><Link className="text-link" href="/pricing">Explore plans →</Link></div>}
      </section>
    </main>
  );
}
