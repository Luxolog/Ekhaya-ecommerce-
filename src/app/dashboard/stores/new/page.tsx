import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewStoreForm from "./new-store-form";

export default async function NewStorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("store_subscriptions")
    .select("plan_code,status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href="/dashboard">← Dashboard</Link>
      </header>
      <section className="dashboard-content narrow-content">
        <div className="eyebrow">STORE SETUP / STEP 01</div>
        <h1>Create your store.</h1>
        <p className="dashboard-lead">Give your online business a name and a store address. You can customise the rest after setup.</p>
        {subscription ? (
          <NewStoreForm />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">E</div>
            <h3>Choose your plan first.</h3>
            <p>Your subscription determines how many stores and products you can manage.</p>
            <Link className="button button-primary" href="/#pricing">View plans <span>→</span></Link>
          </div>
        )}
      </section>
    </main>
  );
}
