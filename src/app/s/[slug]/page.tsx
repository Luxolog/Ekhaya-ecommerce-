import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, StorefrontHero, StorefrontShell } from "@/components/storefront";
import type { PublicImage, PublicProduct } from "@/lib/storefront";

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase.from("storefront_stores").select("*").eq("slug", slug).maybeSingle();
  if (!store) notFound();

  const [{ data: products }, { data: collections }, { data: images }] = await Promise.all([
    supabase.from("storefront_products").select("*").eq("store_id", store.id).order("name").limit(12),
    supabase.from("storefront_collections").select("*").eq("store_id", store.id).order("position"),
    supabase.from("storefront_product_images").select("*").eq("store_id", store.id).order("position"),
  ]);

  const imageByProduct = new Map<string,string>();
  for (const image of (images ?? []) as PublicImage[]) {
    if (!imageByProduct.has(image.product_id)) imageByProduct.set(image.product_id, supabase.storage.from("store-assets").getPublicUrl(image.storage_path).data.publicUrl);
  }
  const featuredProduct = (products ?? [])[0] as PublicProduct | undefined;
  const heroImageUrl = featuredProduct ? imageByProduct.get(featuredProduct.id) : undefined;

  return (
    <StorefrontShell store={store}>
      <StorefrontHero store={store} imageUrl={heroImageUrl} imageAlt={featuredProduct?.name}/>
      {collections?.length ? <section className="public-store-section public-store-collections"><div className="public-store-section-heading"><div><span className="public-store-eyebrow">BROWSE BY CATEGORY</span><h2>Explore collections</h2></div><Link href={`/s/${slug}/collections`}>View all →</Link></div><div className="public-collection-grid">{collections.slice(0,3).map((collection)=><Link className="public-collection-card" href={`/s/${slug}/collections/${collection.slug}`} key={collection.id}><h3>{collection.name}</h3><p>{collection.description || "Explore this collection."}</p></Link>)}</div></section>:null}
      <section className="public-store-section public-store-products"><div className="public-store-section-heading"><div><span className="public-store-eyebrow">CURATED FOR YOU</span><h2>Featured products</h2></div></div>
        {products?.length ? <div className="public-product-grid">{(products as PublicProduct[]).map((product)=><ProductCard key={product.id} store={store} product={product} imageUrl={imageByProduct.get(product.id)}/>)}</div>:<div className="public-store-empty">This store is getting its products ready. Please check back soon.</div>}
      </section>
    </StorefrontShell>
  );
}
