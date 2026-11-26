import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase.from("stores").select("id,name,owner_user_id").eq("id", storeId).maybeSingle();
  if (!store) notFound();

  const [{ data: products }, { data: subscription }] = await Promise.all([
    supabase.from("products").select("id,name,slug,price,status,product_type,inventory_quantity,track_inventory,sku,created_at").eq("store_id", storeId).order("created_at", { ascending: false }),
    supabase.from("store_subscriptions").select("plan_code").eq("user_id", store.owner_user_id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const { data: plan } = subscription
    ? await supabase.from("plans").select("max_products,max_product_images,max_digital_products").eq("code", subscription.plan_code).maybeSingle()
    : { data: null };

  const productIds = (products ?? []).map((product) => product.id);
  const { data: images } = productIds.length
    ? await supabase.from("product_images").select("product_id,storage_path,position").in("product_id", productIds).order("position")
    : { data: [] };

  const imageByProduct = new Map<string, string>();
  for (const image of images ?? []) {
    if (!imageByProduct.has(image.product_id)) {
      imageByProduct.set(image.product_id, supabase.storage.from("store-assets").getPublicUrl(image.storage_path).data.publicUrl);
    }
  }

  const totalProducts = products?.length ?? 0;
  const digitalProducts = products?.filter((product) => product.product_type === "digital").length ?? 0;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <Link className="signout-button" href={`/dashboard/stores/${storeId}`}>← Store overview</Link>
      </header>
      <section className="dashboard-content">
        <div className="eyebrow">{store.name.toUpperCase()} / CATALOGUE</div>
        <div className="catalogue-heading">
          <div><h1>Products</h1><p className="dashboard-lead">Manage the products and services your customers can buy.</p></div>
          <Link className="button button-primary" href={`/dashboard/stores/${storeId}/products/new`}>Add product <span>＋</span></Link>
        </div>
        <div className="catalogue-stats">
          <article><span>PRODUCTS</span><strong>{totalProducts}{plan ? <small> / {plan.max_products}</small> : null}</strong></article>
          <article><span>DIGITAL PRODUCTS</span><strong>{digitalProducts}{plan ? <small> / {plan.max_digital_products}</small> : null}</strong></article>
          <article><span>STORE</span><strong>{store.name}</strong></article>
        </div>
        {products?.length ? (
          <div className="product-list">
            {products.map((product) => {
              const image = imageByProduct.get(product.id);
              return (
                <Link className="product-row" href={`/dashboard/stores/${storeId}/products/${product.id}/edit`} key={product.id}>
                  <div className="product-row-image" style={image ? { backgroundImage: `url("${image}")` } : undefined}>{image ? null : <span>◇</span>}</div>
                  <div className="product-row-main"><strong>{product.name}</strong><small>{product.sku || product.slug} · {product.product_type}</small></div>
                  <div className="product-row-stock">{product.track_inventory ? `${product.inventory_quantity} in stock` : "Inventory not tracked"}</div>
                  <div className="product-row-price">R {Number(product.price).toFixed(2)}</div>
                  <span className={`status-pill status-${product.status}`}>{product.status}</span>
                  <span className="product-row-arrow">→</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state product-empty">
            <div className="empty-icon">◇</div>
            <h3>Your catalogue starts here.</h3>
            <p>Add your first product, set a price and upload its images.</p>
            <Link className="button button-primary" href={`/dashboard/stores/${storeId}/products/new`}>Add your first product <span>→</span></Link>
          </div>
        )}
      </section>
    </main>
  );
}
