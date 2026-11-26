"use client";

import { useState } from "react";

type CartItem={productId:string;slug:string;name:string;price:number;quantity:number;imageUrl?:string};
type ProductInput={id:string;slug:string;name:string;price:number;imageUrl?:string};
export default function AddToCartButton({storeSlug,product}:{storeSlug:string;product:ProductInput}) {
  const [added,setAdded]=useState(false);
  function add(){
    try {
      const key=`ekhaya-cart:${storeSlug}`;
      const items=JSON.parse(localStorage.getItem(key)||"[]") as CartItem[];
      const existing=items.find((item)=>item.productId===product.id);
      if(existing) existing.quantity=Math.min(existing.quantity+1,99);
      else items.push({productId:product.id,slug:product.slug,name:product.name,price:product.price,quantity:1,imageUrl:product.imageUrl});
      localStorage.setItem(key,JSON.stringify(items));
      setAdded(true);
      window.setTimeout(()=>setAdded(false),1800);
    } catch { setAdded(false); }
  }
  return <button type="button" className="public-store-button public-add-cart" onClick={add}>{added?"Added to cart ✓":"Add to cart →"}</button>;
}
