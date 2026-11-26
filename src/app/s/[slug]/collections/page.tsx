import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorefrontShell } from "@/components/storefront";

export default async function CollectionsPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const supabase=await createClient();
 const {data:store}=await supabase.from("storefront_stores").select("*").eq("slug",slug).maybeSingle();
 if(!store) notFound();
 const {data:collections}=await supabase.from("storefront_collections").select("*").eq("store_id",store.id).order("position");
 return <StorefrontShell store={store}><section className="public-store-section" style={{paddingTop:55}}><span className="public-store-eyebrow">DISCOVER THE STORE</span><h1 style={{font:"48px 'Playfair Display',serif",margin:"12px 0 28px"}}>Collections</h1>{collections?.length?<div className="public-collection-grid">{collections.map((collection)=><Link className="public-collection-card" href={`/s/${slug}/collections/${collection.slug}`} key={collection.id}><h3>{collection.name}</h3><p>{collection.description||"Explore this collection."}</p></Link>)}</div>:<div className="public-store-empty">No collections have been published yet.</div>}</section></StorefrontShell>;
}
