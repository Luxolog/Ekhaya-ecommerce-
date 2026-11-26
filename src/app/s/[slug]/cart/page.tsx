import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorefrontShell } from "@/components/storefront";
import CartClient from "./cart-client";

export default async function CartPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const supabase=await createClient();
 const {data:store}=await supabase.from("storefront_stores").select("*").eq("slug",slug).maybeSingle();
 if(!store) notFound();
 return <StorefrontShell store={store}><section className="public-store-section" style={{paddingTop:50}}><span className="public-store-eyebrow">YOUR SELECTION</span><h1 style={{font:"48px 'Playfair Display',serif",margin:"12px 0 25px"}}>Shopping bag</h1><CartClient storeSlug={slug} currency={store.currency}/></section></StorefrontShell>;
}
