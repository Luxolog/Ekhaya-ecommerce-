import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "../product-form";

export default async function NewProductPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase.from("stores").select("id,name,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) notFound();

  const { data: subscription } = await supabase.from("store_subscriptions").select("plan_code").eq("user_id", store.owner_user_id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: plan } = subscription
    ? await supabase.from("plans").select("max_products,max_product_images,max_digital_products").eq("code", subscription.plan_code).maybeSingle()
    : { data: null };

  const { data: ownedStores } = await supabase.from("stores").select("id").eq("owner_user_id", store.owner_user_id);
  const ownedStoreIds = (ownedStores ?? []).map((item) => item.id);
  const [{ count: productCount }, { count: digitalCount }] = ownedStoreIds.length
    ? await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).in("store_id", ownedStoreIds),
        supabase.from("products").select("*", { count: "exact", head: true }).in("store_id", ownedStoreIds).eq("product_type", "digital"),
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href={`/dashboard/stores/${storeId}/products`}>← Products</Link>
      </header>
      <section className="dashboard-content product-form-page">
        <div className="eyebrow">{store.name.toUpperCase()} / ADD PRODUCT</div>
        <h1>Add a product.</h1>
        <p className="dashboard-lead">Add the details customers need to understand and buy what you offer.</p>
        {plan ? (
          <ProductForm storeId={storeId} maxImages={plan.max_product_images} productCount={productCount ?? 0} maxProducts={plan.max_products} digitalCount={digitalCount ?? 0} maxDigitalProducts={plan.max_digital_products} />
        ) : (
          <div className="empty-state"><h3>An active plan is required.</h3><p>Choose a subscription before adding products.</p><Link className="button button-primary" href="/#pricing">View plans →</Link></div>
        )}
      </section>
    </main>
  );
}
