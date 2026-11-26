alter table public.stores
  add column if not exists storefront_theme_id text not null default 'minimal',
  add column if not exists storefront_appearance jsonb not null default '{}'::jsonb;

update public.stores
set storefront_theme_id = coalesce(settings #>> '{storefront,themeId}', 'minimal'),
    storefront_appearance = case
      when jsonb_typeof(settings #> '{storefront,appearance}') = 'object'
        then settings #> '{storefront,appearance}'
      else '{}'::jsonb
    end;

alter table public.stores drop constraint if exists stores_storefront_theme_id_check;
alter table public.stores add constraint stores_storefront_theme_id_check
  check (storefront_theme_id in ('minimal','luxury','boutique','retail','beauty'));
alter table public.stores drop constraint if exists stores_storefront_appearance_object_check;
alter table public.stores add constraint stores_storefront_appearance_object_check
  check (jsonb_typeof(storefront_appearance) = 'object');

revoke all on table public.stores, public.products, public.product_images,
  public.collections, public.collection_products from anon, public;

grant select (id, name, slug, description, logo_url, favicon_url, currency,
  country_code, status, storefront_theme_id, storefront_appearance)
on public.stores to anon;
grant select (id, store_id, name, slug, description, product_type, status,
  price, compare_at_price, category, is_taxable, weight_grams)
on public.products to anon;
grant select (id, product_id, store_id, storage_path, alt_text, position)
on public.product_images to anon;
grant select (id, store_id, name, slug, description, is_published, position)
on public.collections to anon;
grant select (collection_id, product_id, position)
on public.collection_products to anon;

create or replace view public.storefront_stores with (security_invoker = true) as
select id, name, slug, description, logo_url, favicon_url, currency,
       country_code, storefront_theme_id, storefront_appearance
from public.stores where status = 'published';

create or replace view public.storefront_products with (security_invoker = true) as
select p.id, p.store_id, p.name, p.slug, p.description, p.product_type,
       p.price, p.compare_at_price, p.category, p.is_taxable, p.weight_grams
from public.products p join public.stores s on s.id = p.store_id
where p.status = 'published' and s.status = 'published';

create or replace view public.storefront_product_images with (security_invoker = true) as
select pi.id, pi.product_id, pi.store_id, pi.storage_path, pi.alt_text, pi.position
from public.product_images pi
join public.products p on p.id = pi.product_id
join public.stores s on s.id = pi.store_id
where p.status = 'published' and s.status = 'published';

create or replace view public.storefront_collections with (security_invoker = true) as
select c.id, c.store_id, c.name, c.slug, c.description, c.position
from public.collections c join public.stores s on s.id = c.store_id
where c.is_published and s.status = 'published';

create or replace view public.storefront_collection_products with (security_invoker = true) as
select cp.collection_id, cp.product_id, cp.position
from public.collection_products cp
join public.collections c on c.id = cp.collection_id
join public.stores s on s.id = c.store_id
where c.is_published and s.status = 'published';

grant select on public.storefront_stores, public.storefront_products,
  public.storefront_product_images, public.storefront_collections,
  public.storefront_collection_products to anon, authenticated;
