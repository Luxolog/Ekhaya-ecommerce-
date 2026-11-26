"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { formatStorePrice } from "@/lib/storefront";

type CartItem={productId:string;slug:string;name:string;price:number;quantity:number;imageUrl?:string};
export default function CartClient({storeSlug,currency}:{storeSlug:string;currency:string}) {
 const [items,setItems]=useState<CartItem[]>([]);
 const [ready,setReady]=useState(false);
 const key=`ekhaya-cart:${storeSlug}`;
 useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem(key)||"[]") as CartItem[])}catch{setItems([])}setReady(true)},[key]);
 function save(next:CartItem[]){setItems(next);localStorage.setItem(key,JSON.stringify(next))}
 const total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
 if(!ready)return <div className="public-store-empty">Loading your shopping bag…</div>;
 if(!items.length)return <div className="public-store-empty">Your shopping bag is empty.<p><Link href={`/s/${storeSlug}`}>Continue shopping →</Link></p></div>;
 return <div className="public-cart"><div className="public-cart-items">{items.map((item)=><article key={item.productId} className="public-cart-item">{item.imageUrl?<img src={item.imageUrl} alt=""/>:<div className="public-cart-no-image">◇</div>}<div><Link href={`/s/${storeSlug}/products/${item.slug}`}>{item.name}</Link><small>{formatStorePrice(item.price,currency)}</small><div className="public-cart-quantity"><button onClick={()=>save(items.map((x)=>x.productId===item.productId?{...x,quantity:Math.max(1,x.quantity-1)}:x))}>−</button><span>{item.quantity}</span><button onClick={()=>save(items.map((x)=>x.productId===item.productId?{...x,quantity:Math.min(99,x.quantity+1)}:x))}>+</button><button className="public-cart-remove" onClick={()=>save(items.filter((x)=>x.productId!==item.productId))}>Remove</button></div></div><strong>{formatStorePrice(item.price*item.quantity,currency)}</strong></article>)}</div><div className="public-cart-total"><span>Subtotal</span><strong>{formatStorePrice(total,currency)}</strong></div><p className="public-cart-note">Checkout and payment processing are the next build milestone. No payment has been taken.</p><Link className="public-store-button" href={`/s/${storeSlug}`}>Continue shopping →</Link></div>;
}
