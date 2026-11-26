import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, StorefrontShell } from "@/components/storefront";
import type { PublicImage, PublicProduct } from "@/lib/storefront";

export default async function CollectionPage({params}:{params:Promise<{slug:string;collectionSlug:string}>}) {
 const {slug,collectionSlug}=await params; const supabase=await createClient();
 const {data:store}=await supabase.from("storefront_stores").select("*").eq("slug",slug).maybeSingle();
 if(!store) notFound();
 const {data:collection}=await supabase.from("storefront_collections").select("*").eq("store_id",store.id).eq("slug",collectionSlug).maybeSingle();
 if(!collection) notFound();
 const {data:links}=await supabase.from("storefront_collection_products").select("product_id,position").eq("collection_id",collection.id).order("position");
 const ids=(links??[]).map((item)=>item.product_id);
 const {data:products}=ids.length?await supabase.from("storefront_products").select("*").in("id",ids):{data:[]};
 const {data:images}=ids.length?await supabase.from("storefront_product_images").select("*").in("product_id",ids).order("position"):{data:[]};
 const imageMap=new Map<string,string>();
 for(const image of (images??[]) as PublicImage[]) if(!imageMap.has(image.product_id)) imageMap.set(image.product_id,supabase.storage.from("store-assets").getPublicUrl(image.storage_path).data.publicUrl);
 const ordered=(links??[]).map((link)=>products?.find((product)=>product.id===link.product_id)).filter((product):product is NonNullable<typeof products>[number]=>Boolean(product));
 return <StorefrontShell store={store}><section className="public-store-section" style={{paddingTop:50}}><span className="public-store-eyebrow">COLLECTION</span><h1 style={{font:"48px 'Playfair Display',serif",margin:"12px 0"}}>{collection.name}</h1>{collection.description?<p className="public-product-description">{collection.description}</p>:null}{ordered.length?<div className="public-product-grid">{ordered.map((product)=><ProductCard key={product.id} store={store} product={product} imageUrl={imageMap.get(product.id)}/>)}</div>:<div className="public-store-empty">There are no published products in this collection yet.</div>}</section></StorefrontShell>;
}
