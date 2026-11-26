import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm, { type ExistingProductImage } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ storeId: string; productId: string }> }) {
  const { storeId, productId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: store }, { data: product }, { data: subscription }] = await Promise.all([
    supabase.from("stores").select("id,name,owner_user_id").eq("id", storeId).maybeSingle(),
    supabase.from("products").select("*").eq("id", productId).eq("store_id", storeId).maybeSingle(),
    supabase.from("store_subscriptions").select("plan_code").eq("user_id", user.id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!store || !product) notFound();

  const { data: plan } = subscription
    ? await supabase.from("plans").select("max_products,max_product_images,max_digital_products").eq("code", subscription.plan_code).maybeSingle()
    : { data: null };
  const [{ data: images }, { count: productCount }, { count: digitalCount }] = await Promise.all([
    supabase.from("product_images").select("id,storage_path,alt_text,position").eq("product_id", productId).order("position"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", storeId),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", storeId).eq("product_type", "digital"),
  ]);

  const existingImages: ExistingProductImage[] = (images ?? []).map((image) => ({
    ...image,
    url: supabase.storage.from("store-assets").getPublicUrl(image.storage_path).data.publicUrl,
  }));

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href={`/dashboard/stores/${storeId}/products`}>← Products</Link>
      </header>
      <section className="dashboard-content product-form-page">
        <div className="eyebrow">{store.name.toUpperCase()} / EDIT PRODUCT</div>
        <h1>Edit product.</h1>
        <p className="dashboard-lead">Update the details, images, stock and visibility of this product.</p>
        {plan ? (
          <ProductForm storeId={storeId} maxImages={plan.max_product_images} productCount={productCount ?? 0} maxProducts={plan.max_products} digitalCount={digitalCount ?? 0} maxDigitalProducts={plan.max_digital_products} initialProduct={product} initialImages={existingImages} />
        ) : (
          <div className="empty-state"><h3>Subscription not found.</h3><p>Please review your active plan before editing products.</p></div>
        )}
      </section>
    </main>
  );
}
