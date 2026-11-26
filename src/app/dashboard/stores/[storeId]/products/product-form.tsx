"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/database";

type ProductRow = Tables<"products">;
type ProductImageInsert = TablesInsert<"product_images">;
export type ExistingProductImage = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  url: string;
};

type Props = {
  storeId: string;
  maxImages: number;
  productCount: number;
  maxProducts: number;
  digitalCount: number;
  maxDigitalProducts: number;
  initialProduct?: ProductRow | null;
  initialImages?: ExistingProductImage[];
};

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const digitalTypes = ["application/pdf", "application/zip", "application/epub+zip", "audio/mpeg", "audio/mp4", "video/mp4", "image/jpeg", "image/png", "image/webp"];

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ProductForm({ storeId, maxImages, productCount, maxProducts, digitalCount, maxDigitalProducts, initialProduct = null, initialImages = [] }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialProduct));
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "");
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [barcode, setBarcode] = useState(initialProduct?.barcode ?? "");
  const [productType, setProductType] = useState(initialProduct?.product_type ?? "physical");
  const [price, setPrice] = useState(String(initialProduct?.price ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(initialProduct?.compare_at_price == null ? "" : String(initialProduct.compare_at_price));
  const [costPrice, setCostPrice] = useState(initialProduct?.cost_price == null ? "" : String(initialProduct.cost_price));
  const [trackInventory, setTrackInventory] = useState(initialProduct?.track_inventory ?? false);
  const [inventory, setInventory] = useState(String(initialProduct?.inventory_quantity ?? 0));
  const [allowBackorder, setAllowBackorder] = useState(initialProduct?.allow_backorder ?? false);
  const [weight, setWeight] = useState(initialProduct?.weight_grams == null ? "" : String(initialProduct.weight_grams));
  const [status, setStatus] = useState(initialProduct?.status ?? "draft");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState(initialImages);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const finalSlug = slugEdited ? slug : makeSlug(name);
  const isEditing = Boolean(initialProduct);
  const isAtProductLimit = !isEditing && productCount >= maxProducts;
  const isAtDigitalLimit = !isEditing && digitalCount >= maxDigitalProducts;
  const remainingImages = Math.max(0, maxImages - existingImages.length);

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.some((file) => !imageTypes.includes(file.type))) {
      setError("Please select JPG, PNG, WebP or AVIF images only.");
      event.target.value = "";
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Each product image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    setSelectedImages(files.slice(0, remainingImages));
  }

  function handleDigitalFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && !digitalTypes.includes(file.type)) {
      setError("Use a PDF, ZIP, EPUB, MP3, MP4, JPG, PNG or WebP file.");
      event.target.value = "";
      return;
    }
    if (file && file.size > 50 * 1024 * 1024) {
      setError("The digital product file must be 50 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    setDigitalFile(file);
  }

  async function removeImage(image: ExistingProductImage) {
    setError("");
    const { error: rowError } = await supabase.from("product_images").delete().eq("id", image.id).eq("store_id", storeId);
    if (rowError) {
      setError(rowError.message);
      return;
    }
    setExistingImages((current) => current.filter((item) => item.id !== image.id));
    const { error: storageError } = await supabase.storage.from("store-assets").remove([image.storage_path]);
    if (storageError) setError(`Image record removed, but storage cleanup needs attention: ${storageError.message}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!name.trim() || !finalSlug.trim() || Number(price) < 0 || !Number.isFinite(Number(price))) {
      setError("Enter a product name, valid store URL and price.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
      setError("The product URL must use lowercase letters, numbers and hyphens.");
      return;
    }
    if (compareAtPrice && Number(compareAtPrice) < Number(price)) {
      setError("The original price must be equal to or higher than the selling price.");
      return;
    }
    if (selectedImages.length > remainingImages) {
      setError(`Your plan allows ${maxImages} images per product. Remove an existing image or select fewer files.`);
      return;
    }
    if (!isEditing && isAtProductLimit) {
      setError(`Your plan allows ${maxProducts} products in this store. Upgrade to add more.`);
      return;
    }
    if (productType === "digital" && !initialProduct?.digital_asset_path && !digitalFile) {
      setError("Choose the file customers will receive when they purchase this digital product.");
      return;
    }
    if (productType === "digital" && !isEditing && isAtDigitalLimit) {
      setError(`Your plan allows ${maxDigitalProducts} digital products. Upgrade to add more.`);
      return;
    }

    setLoading(true);
    let productId = initialProduct?.id;
    const uploadedImagePaths: string[] = [];
    const insertedImageIds: string[] = [];
    let uploadedDigitalPath: string | null = null;
    const previousDigitalPath = initialProduct?.digital_asset_path ?? null;
    try {
      const values = {
        name: name.trim(),
        slug: finalSlug.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        product_type: productType,
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        track_inventory: productType === "physical" ? trackInventory : false,
        inventory_quantity: productType === "physical" && trackInventory ? Math.max(0, Number(inventory) || 0) : 0,
        allow_backorder: productType === "physical" ? allowBackorder : false,
        weight_grams: productType === "physical" && weight ? Math.max(0, Number(weight) || 0) : null,
        status,
        digital_asset_path: productType === "digital" ? (initialProduct?.digital_asset_path ?? null) : null,
      };

      if (initialProduct) {
        const { error: updateError } = await supabase.from("products").update(values).eq("id", initialProduct.id).eq("store_id", storeId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase.from("products").insert({ ...values, store_id: storeId }).select("id").single();
        if (insertError) throw insertError;
        productId = data.id;
      }

      if (!productId) throw new Error("Product record was not returned.");

      if (productType === "digital" && digitalFile) {
        const extension = digitalFile.name.split(".").pop()?.toLowerCase() || "file";
        uploadedDigitalPath = `${storeId}/${productId}/${crypto.randomUUID()}.${extension}`;
        const { error: digitalUploadError } = await supabase.storage.from("product-downloads").upload(uploadedDigitalPath, digitalFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: digitalFile.type,
        });
        if (digitalUploadError) throw digitalUploadError;
        const { error: digitalUpdateError } = await supabase.from("products").update({ digital_asset_path: uploadedDigitalPath }).eq("id", productId).eq("store_id", storeId);
        if (digitalUpdateError) throw digitalUpdateError;
      }

      const imageRows: ProductImageInsert[] = [];
      for (let index = 0; index < selectedImages.length; index++) {
        const file = selectedImages[index];
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${storeId}/${productId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("store-assets").upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        if (uploadError) throw uploadError;
        uploadedImagePaths.push(path);
        imageRows.push({
          product_id: productId,
          store_id: storeId,
          storage_path: path,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          position: existingImages.length + index,
        });
      }

      for (const imageRow of imageRows) {
        const { data: insertedImage, error: imageInsertError } = await supabase
          .from("product_images")
          .insert(imageRow)
          .select("id")
          .single();
        if (imageInsertError) throw imageInsertError;
        insertedImageIds.push(insertedImage.id);
      }

      if (previousDigitalPath && (productType !== "digital" || uploadedDigitalPath)) {
        await supabase.storage.from("product-downloads").remove([previousDigitalPath]);
      }

      router.push(`/dashboard/stores/${storeId}/products`);
      router.refresh();
    } catch (err) {
      if (insertedImageIds.length) await supabase.from("product_images").delete().in("id", insertedImageIds);
      if (uploadedImagePaths.length) await supabase.storage.from("store-assets").remove(uploadedImagePaths);
      if (uploadedDigitalPath && productId) {
        if (initialProduct) {
          await supabase.from("products").update({ digital_asset_path: previousDigitalPath }).eq("id", productId).eq("store_id", storeId);
        } else {
          await supabase.from("products").delete().eq("id", productId).eq("store_id", storeId);
        }
        await supabase.storage.from("product-downloads").remove([uploadedDigitalPath]);
      } else if (!initialProduct && productId) {
        await supabase.from("products").delete().eq("id", productId).eq("store_id", storeId);
      } else if (initialProduct && productId) {
        await supabase.from("products").update({ digital_asset_path: previousDigitalPath }).eq("id", productId).eq("store_id", storeId);
      }
      setError(err instanceof Error ? err.message : "Unable to save this product. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <section className="product-form-section">
        <div className="product-section-heading"><span>01</span><div><h2>Product details</h2><p>Start with the essentials.</p></div></div>
        <div className="product-form-grid">
          <label className="field-wide">Product name<input required maxLength={140} value={name} onChange={(event) => { setName(event.target.value); if (!slugEdited) setSlug(makeSlug(event.target.value)); }} placeholder="e.g. Signature Linen Spray" /></label>
          <label className="field-wide">Product URL<div className="slug-input"><span>your-store/</span><input required value={finalSlug} onChange={(event) => { setSlugEdited(true); setSlug(makeSlug(event.target.value)); }} placeholder="product-name" /></div></label>
          <label>Product type<select value={productType} onChange={(event) => setProductType(event.target.value)}><option value="physical">Physical product</option><option value="digital">Digital product</option><option value="service">Service</option><option value="booking">Bookable service</option></select></label>
          <label>Category<input maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Home fragrance" /></label>
          <label className="field-wide">Description<textarea rows={5} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the product, what makes it useful and what customers receive." /></label>
          <label>SKU<input maxLength={80} value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Optional stock code" /></label>
          <label>Barcode<input maxLength={80} value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="EAN / UPC / barcode" /></label>
        </div>
      </section>

      <section className="product-form-section">
        <div className="product-section-heading"><span>02</span><div><h2>Pricing</h2><p>Set your selling price and optional reference costs.</p></div></div>
        <div className="product-form-grid">
          <label>Selling price (ZAR)<input type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" /></label>
          <label>Original price (ZAR)<input type="number" min="0" step="0.01" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} placeholder="Optional sale comparison" /></label>
          <label>Cost price (ZAR)<input type="number" min="0" step="0.01" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} placeholder="Private to your store" /></label>
        </div>
      </section>

      {productType === "physical" && (
        <section className="product-form-section">
          <div className="product-section-heading"><span>03</span><div><h2>Inventory and delivery</h2><p>Keep track of available stock.</p></div></div>
          <label className="toggle-field"><input type="checkbox" checked={trackInventory} onChange={(event) => setTrackInventory(event.target.checked)} /> Track inventory for this product</label>
          {trackInventory && <div className="product-form-grid"><label>Available quantity<input type="number" min="0" step="1" value={inventory} onChange={(event) => setInventory(event.target.value)} /></label><label>Weight (grams)<input type="number" min="0" step="1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Optional" /></label><label className="toggle-field"><input type="checkbox" checked={allowBackorder} onChange={(event) => setAllowBackorder(event.target.checked)} /> Allow orders when out of stock</label></div>}
        </section>
      )}

      {productType === "digital" && (
        <section className="product-form-section">
          <div className="product-section-heading"><span>03</span><div><h2>Digital delivery file</h2><p>Upload the file customers receive after purchase. Maximum 50 MB.</p></div></div>
          {initialProduct?.digital_asset_path && <p className="existing-file">Current file: {initialProduct.digital_asset_path.split("/").pop()}</p>}
          <label className="upload-drop">Choose digital file<input type="file" accept=".pdf,.zip,.epub,.mp3,.mp4,.jpg,.jpeg,.png,.webp" onChange={handleDigitalFile} /><small>{digitalFile ? digitalFile.name : "PDF, ZIP, EPUB, MP3, MP4, JPG or PNG"}</small></label>
        </section>
      )}

      <section className="product-form-section">
        <div className="product-section-heading"><span>{productType === "physical" ? "04" : "04"}</span><div><h2>Product images</h2><p>Up to {maxImages} images on your current plan. Each image can be up to 10 MB.</p></div></div>
        {existingImages.length > 0 && <div className="existing-image-grid">{existingImages.map((image) => <div className="existing-image" key={image.id}><div style={{ backgroundImage: `url("${image.url}")` }} /><button type="button" onClick={() => removeImage(image)} aria-label="Remove image">×</button></div>)}</div>}
        {remainingImages > 0 && <label className="upload-drop">Add product images<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleImages} /><small>{selectedImages.length ? selectedImages.map((file) => file.name).join(", ") : `Choose up to ${remainingImages} more images`}</small></label>}
        {remainingImages === 0 && <p className="field-hint">You've reached the image limit for this product. Remove an image to add another.</p>}
      </section>

      <section className="product-form-section">
        <div className="product-section-heading"><span>05</span><div><h2>Store visibility</h2><p>Save as a draft or make this product available in your published store.</p></div></div>
        <label>Product status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Draft — hidden from customers</option><option value="published">Published — visible in your store</option><option value="archived">Archived — no longer for sale</option></select></label>
      </section>

      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="product-form-actions"><button type="button" className="button button-outline" onClick={() => router.push(`/dashboard/stores/${storeId}/products`)}>Cancel</button><button type="submit" className="button button-primary" disabled={loading || isAtProductLimit}>{loading ? "Saving product…" : isEditing ? "Save changes" : "Save product"} <span>→</span></button></div>
      {!isEditing && isAtProductLimit && <p className="form-error">You've reached your plan's product limit. Upgrade to add more products.</p>}
    </form>
  );
}
