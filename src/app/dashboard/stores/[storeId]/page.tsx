import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StoreOverviewPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase.from("stores").select("*").eq("id", storeId).maybeSingle();
  if (!store) notFound();

  const [{ count: productCount }, { count: orderCount }, { data: domains }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", store.id),
    supabase.from("store_domains").select("domain,verification_status,is_primary").eq("store_id", store.id),
  ]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href="/dashboard">← All stores</Link>
      </header>
      <section className="dashboard-content">
        <div className="eyebrow">STORE WORKSPACE / OVERVIEW</div>
        <h1>{store.name}</h1>
        <p className="dashboard-lead">ekhaya.store/{store.slug} · <span className={`status-pill status-${store.status}`}>{store.status}</span></p>
        <div className="dashboard-summary">
          <article><span>PRODUCTS</span><strong>{productCount ?? 0}</strong><small>In your catalogue</small></article>
          <article><span>ORDERS</span><strong>{orderCount ?? 0}</strong><small>Customer orders</small></article>
          <article><span>STOREFRONT</span><strong>{store.status === "published" ? "Live" : "Draft"}</strong><small>Store visibility</small></article>
        </div>
        <div className="store-settings-grid">
          <article><div className="eyebrow">CATALOGUE</div><h2>Products</h2><p>Add products, prices, images and inventory.</p><Link className="text-link" href={`/dashboard/stores/${storeId}/products`}>Manage products →</Link></article>
          <article><div className="eyebrow">YOUR DOMAIN</div><h2>Domain settings</h2><p>{domains?.length ? domains.map((d) => d.domain).join(", ") : "Connect a domain you already own on an eligible plan."}</p><span className="coming-soon">DOMAIN CONNECTION NEXT</span></article>
          <article><div className="eyebrow">CHECKOUT</div><h2>Payments</h2><p>Connect your own supported payment gateway account.</p><span className="coming-soon">PAYMENT SETUP NEXT</span></article>
        </div>
      </section>
    </main>
  );
}
