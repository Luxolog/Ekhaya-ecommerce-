"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishStoreButton({storeId,status}:{storeId:string;status:string}) {
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const router=useRouter();
 const published=status==="published";
 async function toggle(){
  setBusy(true);setError("");
  try{
   const response=await fetch(`/api/stores/${storeId}/publish`,{method:"POST"});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Unable to update store status.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update store status.");}
  finally{setBusy(false);}
 }
 return <div className="publish-store-control"><button className={published?"button button-outline":"button button-primary"} type="button" onClick={toggle} disabled={busy}>{busy?"Please wait…":published?"Unpublish storefront":"Publish storefront"}</button>{error?<span role="alert">{error}</span>:null}</div>;
}
