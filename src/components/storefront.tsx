import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicProduct, PublicStore } from "@/lib/storefront";
import { formatStorePrice, getStorefrontHeadline, getStorefrontStyle } from "@/lib/storefront";
import { getStoreTheme } from "@/lib/store-themes";

type ProductCardProps = {
  store: PublicStore;
  product: PublicProduct;
  imageUrl?: string;
};

export function StorefrontShell({ store, children }: { store: PublicStore; children: ReactNode }) {
  const theme = getStoreTheme(store.storefront_theme_id);
  return (
    <main className="public-storefront" data-theme={theme.id} style={getStorefrontStyle(store)}>
      <header className="public-store-header">
        <Link href={`/s/${store.slug}`} className="public-store-brand">
          {store.logo_url ? <img src={store.logo_url} alt="" /> : <span className="public-store-mark">{store.name.slice(0,1).toUpperCase()}</span>}
          <strong>{store.name}</strong>
        </Link>
        <nav aria-label="Store navigation">
          <Link href={`/s/${store.slug}`}>Home</Link>
          <Link href={`/s/${store.slug}/collections`}>Collections</Link>
          <Link href={`/s/${store.slug}/cart`}>Cart</Link>
        </nav>
      </header>
      {children}
      <footer className="public-store-footer">
        <strong>{store.name}</strong><span>Powered by Ekhaya Ecommerce</span>
      </footer>
    </main>
  );
}

export function StorefrontHero({ store }: { store: PublicStore }) {
  const theme = getStoreTheme(store.storefront_theme_id);
  return (
    <section className="public-store-hero">
      <div className="public-store-hero-copy">
        <span className="public-store-eyebrow">{theme.heroEyebrow ?? "THE OFFICIAL ONLINE STORE"}</span>
        <h1>{getStorefrontHeadline(store)}</h1>
        <p>{store.description || theme.heroDescription || "Discover the latest products from our store."}</p>
        <Link className="public-store-button" href={`/s/${store.slug}/collections`}>{theme.heroCta ?? "Explore the collection"} <span>→</span></Link>
      </div>
      <div className="public-store-hero-art"><span>{store.name}</span><i/><b>{theme.id === "driving" ? <>LEARN<br/>TO DRIVE</> : theme.id === "insurance" ? <>COVER<br/>WITH CONFIDENCE</> : theme.id === "household" ? <>EVERYDAY<br/>ESSENTIALS</> : <>SHOP<br/>THE EDIT</>}</b></div>
    </section>
  );
}

export function ProductCard({ store, product, imageUrl }: ProductCardProps) {
  return (
    <article className="public-product-card">
      <Link href={`/s/${store.slug}/products/${product.slug}`} className="public-product-image">
        {imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" /> : <span className="public-product-placeholder">◇</span>}
        {product.compare_at_price && product.compare_at_price > product.price ? <span className="public-sale-tag">SALE</span> : null}
      </Link>
      <div className="public-product-info">
        {product.category ? <span className="public-product-category">{product.category}</span> : null}
        <Link href={`/s/${store.slug}/products/${product.slug}`}><h3>{product.name}</h3></Link>
        <div className="public-product-price">
          <strong>{formatStorePrice(Number(product.price), store.currency)}</strong>
          {product.compare_at_price && product.compare_at_price > product.price ? <del>{formatStorePrice(Number(product.compare_at_price), store.currency)}</del> : null}
        </div>
      </div>
    </article>
  );
}
