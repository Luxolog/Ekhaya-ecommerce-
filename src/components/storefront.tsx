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
      <header className={`public-store-header public-store-header-${theme.id}`}>
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
      <footer className={`public-store-footer public-store-footer-${theme.id}`}>
        <strong>{store.name}</strong><span>Powered by Ekhaya Ecommerce</span>
      </footer>
    </main>
  );
}

export function StorefrontHero({ store, imageUrl }: { store: PublicStore; imageUrl?: string }) {
  const theme = getStoreTheme(store.storefront_theme_id);
  const eyebrow = theme.id === "luxury" ? "A MORE CONSIDERED COLLECTION"
    : theme.id === "boutique" ? "THE NEW SEASON EDIT"
    : theme.id === "beauty" ? "FEEL GOOD, EVERY DAY"
    : theme.id === "retail" ? "SHOP THE EVERYDAY ESSENTIALS"
    : "THOUGHTFULLY CHOSEN FOR YOU";
  const action = theme.id === "luxury" ? "Discover the collection"
    : theme.id === "boutique" ? "Shop the edit"
    : theme.id === "beauty" ? "Find your favourites"
    : theme.id === "retail" ? "Shop all products"
    : "Explore the collection";

  return (
    <section className={`public-store-hero public-store-hero-${theme.id}`}>
      <div className="public-store-hero-copy">
        <span className="public-store-eyebrow">{eyebrow}</span>
        <h1>{getStorefrontHeadline(store)}</h1>
        <p>{store.description || "Discover the latest products from our store."}</p>
        <Link className="public-store-button" href={`/s/${store.slug}/collections`}>{action} <span aria-hidden="true">→</span></Link>
      </div>
      <div className="public-store-hero-art">
        {imageUrl ? <img className="public-store-hero-image" src={imageUrl} alt="Featured product" fetchPriority="high" /> : <div className="public-store-hero-art-shape" aria-hidden="true" />}
        <span>{store.name}</span>
        <b>{theme.id === "luxury" ? "THE SIGNATURE\nCOLLECTION" : theme.id === "boutique" ? "NEW\nARRIVALS" : theme.id === "beauty" ? "YOUR DAILY\nRITUAL" : theme.id === "retail" ? "MADE FOR\nEVERY DAY" : "LESS, BUT\nBETTER"}</b>
      </div>
    </section>
  );
}

export function ProductCard({ store, product, imageUrl }: ProductCardProps) {
  const theme = getStoreTheme(store.storefront_theme_id);
  const onSale = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  return (
    <article className={`public-product-card public-product-card-${theme.id}`}>
      <Link href={`/s/${store.slug}/products/${product.slug}`} className="public-product-image">
        {imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" /> : <span className="public-product-placeholder">◇</span>}
        {onSale ? <span className="public-sale-tag">SALE</span> : null}
        {theme.id === "boutique" ? <span className="public-product-quick-label">THE EDIT</span> : null}
      </Link>
      <div className="public-product-info">
        {product.category ? <span className="public-product-category">{product.category}</span> : null}
        <Link href={`/s/${store.slug}/products/${product.slug}`}><h3>{product.name}</h3></Link>
        <div className="public-product-price">
          <strong>{formatStorePrice(Number(product.price), store.currency)}</strong>
          {onSale ? <del>{formatStorePrice(Number(product.compare_at_price), store.currency)}</del> : null}
        </div>
      </div>
    </article>
  );
}
