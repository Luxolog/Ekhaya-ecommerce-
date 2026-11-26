import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorefrontShell } from "@/components/storefront";
import { formatStorePrice } from "@/lib/storefront";
import AddToCartButton from "./add-to-cart-button";

export default async function PublicProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase.from("storefront_stores").select("*").eq("slug", slug).maybeSingle();
  if (!store) notFound();
  const { data: product } = await supabase.from("storefront_products").select("*").eq("store_id", store.id).eq("slug", productSlug).maybeSingle();
  if (!product) notFound();
  const { data: images } = await supabase.from("storefront_product_images").select("id,storage_path,alt_text,position").eq("product_id", product.id).order("position");
  const imageUrls = (images ?? []).map((image) => ({url:supabase.storage.from("store-assets").getPublicUrl(image.storage_path).data.publicUrl,alt:image.alt_text || product.name}));
  const primaryImage = imageUrls[0]?.url;
  return <StorefrontShell store={store}>
    <div className="public-breadcrumb">HOME / {product.category?.toUpperCase() || "PRODUCTS"} / {product.name.toUpperCase()}</div>
    <section className="public-product-detail">
      <div className="public-product-gallery">{imageUrls.length ? imageUrls.map((image,index)=><img key={index} src={image.url} alt={image.alt} />):<div className="public-product-image"><span className="public-product-placeholder">◇</span></div>}</div>
      <div>
        <span className="public-store-eyebrow">{product.category || product.product_type}</span>
        <h1 style={{font:"clamp(36px,5vw,58px)/1.05 'Playfair Display',serif",margin:"15px 0"}}>{product.name}</h1>
        <div className="public-detail-price"><strong>{formatStorePrice(Number(product.price),store.currency)}</strong>{product.compare_at_price && product.compare_at_price>product.price?<del>{formatStorePrice(Number(product.compare_at_price),store.currency)}</del>:null}</div>
        {product.description?<p className="public-product-description">{product.description}</p>:null}
        {product.product_type === "service" || product.product_type === "booking" ? <p className="public-product-description">Contact the store for availability and booking details.</p>:null}
        <AddToCartButton storeSlug={slug} product={{id:product.id,slug:product.slug,name:product.name,price:Number(product.price),imageUrl:primaryImage}} />
        <p className="public-product-category" style={{marginTop:18}}>Secure checkout will be available when this store enables payments.</p>
      </div>
    </section>
  </StorefrontShell>;
}
