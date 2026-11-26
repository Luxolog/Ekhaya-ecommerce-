alter table public.products
  add column if not exists category text,
  add column if not exists barcode text;

create index if not exists products_store_status_idx on public.products(store_id,status);
create index if not exists products_store_type_idx on public.products(store_id,product_type);
create index if not exists product_images_product_idx on public.product_images(product_id);
create index if not exists store_subscriptions_user_status_idx on public.store_subscriptions(user_id,status,created_at desc);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_id_store_id_unique') then
    alter table public.products add constraint products_id_store_id_unique unique (id,store_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_images_product_store_fk') then
    alter table public.product_images add constraint product_images_product_store_fk
      foreign key (product_id,store_id) references public.products(id,store_id) on delete cascade;
  end if;
end;
$$;

alter table public.product_images drop constraint if exists product_images_product_id_fkey;

create or replace function private.enforce_product_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  plan_row public.plans%rowtype;
  product_count integer;
  digital_count integer;
begin
  if tg_op = 'UPDATE'
     and new.store_id = old.store_id
     and new.product_type = old.product_type then
    return new;
  end if;

  select s.owner_user_id into owner_id
  from public.stores s
  where s.id = new.store_id;

  if owner_id is null then
    raise exception 'Store not found';
  end if;

  select p.* into plan_row
  from public.store_subscriptions ss
  join public.plans p on p.code = ss.plan_code
  where ss.user_id = owner_id
    and ss.status in ('active','trialing')
    and p.is_active
  order by ss.created_at desc
  limit 1;

  if not found then
    raise exception 'An active subscription is required to add or change products';
  end if;

  select count(*) into product_count
  from public.products p
  where p.store_id = new.store_id
    and (tg_op = 'INSERT' or p.id <> new.id);

  if product_count >= plan_row.max_products then
    raise exception 'Your plan allows up to % products per store', plan_row.max_products;
  end if;

  if new.product_type = 'digital' then
    select count(*) into digital_count
    from public.products p
    where p.store_id = new.store_id
      and p.product_type = 'digital'
      and (tg_op = 'INSERT' or p.id <> new.id);

    if digital_count >= plan_row.max_digital_products then
      raise exception 'Your plan allows up to % digital products per store', plan_row.max_digital_products;
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.enforce_product_plan_limits() from public, anon, authenticated;
drop trigger if exists enforce_product_plan_limits on public.products;
create trigger enforce_product_plan_limits
before insert or update of store_id, product_type on public.products
for each row execute function private.enforce_product_plan_limits();

create or replace function private.enforce_product_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  plan_row public.plans%rowtype;
  image_count integer;
begin
  if tg_op = 'UPDATE'
     and new.product_id = old.product_id
     and new.store_id = old.store_id then
    return new;
  end if;

  select s.owner_user_id into owner_id
  from public.stores s
  where s.id = new.store_id;

  select p.* into plan_row
  from public.store_subscriptions ss
  join public.plans p on p.code = ss.plan_code
  where ss.user_id = owner_id
    and ss.status in ('active','trialing')
    and p.is_active
  order by ss.created_at desc
  limit 1;

  if not found then
    raise exception 'An active subscription is required to add product images';
  end if;

  select count(*) into image_count
  from public.product_images pi
  where pi.product_id = new.product_id
    and (tg_op = 'INSERT' or pi.id <> new.id);

  if image_count >= plan_row.max_product_images then
    raise exception 'Your plan allows up to % images per product', plan_row.max_product_images;
  end if;

  return new;
end;
$$;
revoke all on function private.enforce_product_image_limit() from public, anon, authenticated;
drop trigger if exists enforce_product_image_limit on public.product_images;
create trigger enforce_product_image_limit
before insert or update of product_id, store_id on public.product_images
for each row execute function private.enforce_product_image_limit();

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-downloads','product-downloads',false,52428800,array[
  'application/pdf','application/zip','application/epub+zip','audio/mpeg','audio/mp4',
  'video/mp4','image/jpeg','image/png','image/webp'
])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Store managers can read digital product files" on storage.objects;
drop policy if exists "Store managers can upload digital product files" on storage.objects;
drop policy if exists "Store managers can update digital product files" on storage.objects;
drop policy if exists "Store managers can delete digital product files" on storage.objects;

create policy "Store managers can read digital product files"
on storage.objects for select to authenticated
using (bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and private.is_store_manager(((storage.foldername(name))[1])::uuid));

create policy "Store managers can upload digital product files"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and private.is_store_manager(((storage.foldername(name))[1])::uuid));

create policy "Store managers can update digital product files"
on storage.objects for update to authenticated
using (bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and private.is_store_manager(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and private.is_store_manager(((storage.foldername(name))[1])::uuid));

create policy "Store managers can delete digital product files"
on storage.objects for delete to authenticated
using (bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and private.is_store_manager(((storage.foldername(name))[1])::uuid));
