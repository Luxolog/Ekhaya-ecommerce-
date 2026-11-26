"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewStoreForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestedSlug = useMemo(() => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), [name]);
  const finalSlug = slugEdited ? slug : suggestedSlug;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: createError } = await supabase.rpc("create_store_for_current_user", {
        store_name: name.trim(),
        store_slug: finalSlug.trim(),
        store_description: description.trim() || null,
      });
      if (createError) throw createError;
      const store = Array.isArray(data) ? data[0] : data;
      if (!store?.id) throw new Error("The store was created but its details could not be loaded.");
      router.push(`/dashboard/stores/${store.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your store. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="store-form" onSubmit={handleSubmit}>
      <label>Store name<input required maxLength={80} value={name} onChange={(e) => { setName(e.target.value); if (!slugEdited) setSlug(""); }} placeholder="e.g. The Local Edit" /></label>
      <label>Store address<div className="slug-input"><span>ekhaya.store/</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={50} value={finalSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase()); }} placeholder="your-store-name" /></div></label>
      <small className="field-hint">Use lowercase letters, numbers and hyphens. You can connect your own domain on an eligible plan.</small>
      <label>Short description <span className="optional-label">OPTIONAL</span><textarea rows={3} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers what your business offers." /></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" disabled={loading || !name.trim() || finalSlug.length < 3}>{loading ? "Creating your store…" : "Create store"} <span>→</span></button>
    </form>
  );
}
