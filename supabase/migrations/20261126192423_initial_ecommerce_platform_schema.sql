create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  platform_role text not null default 'merchant' check (platform_role in ('merchant','support','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  code text primary key,
  name text not null,
  monthly_price_zar numeric(10,2) not null check (monthly_price_zar >= 0),
  max_stores integer not null check (max_stores > 0),
  max_products integer not null check (max_products > 0),
  max_product_images integer not null check (max_product_images > 0),
  max_digital_products integer not null check (max_digital_products >= 0),
  max_bookings integer not null check (max_bookings >= 0),
  max_team_members integer not null check (max_team_members > 0),
  custom_domain boolean not null default false,
  professional_email boolean not null default false,
  customer_accounts boolean not null default false,
  advanced_analytics boolean not null default false,
  advanced_marketing boolean not null default false,
  notifications jsonb not null default '{"email":"basic"}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans
(code,name,monthly_price_zar,max_stores,max_products,max_product_images,max_digital_products,max_bookings,max_team_members,custom_domain,professional_email,customer_accounts,advanced_analytics,advanced_marketing,notifications)
values
('starter','Starter',50,1,10,3,2,10,1,false,false,false,false,false,'{"email":"basic"}'),
('business','Business',100,1,50,8,20,100,2,true,true,true,false,false,'{"email":"email_and_order_status"}'),
('growth','Growth',199,3,500,10,100,500,5,true,true,true,true,true,'{"email":"email_order_status_and_marketing"}')
on conflict (code) do nothing;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  favicon_url text,
  support_email text,
  support_phone text,
  currency char(3) not null default 'ZAR',
  country_code char(2) not null default 'ZA',
  timezone text not null default 'Africa/Johannesburg',
  status text not null default 'draft' check (status in ('draft','published','suspended','archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','manager','staff')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique(store_id,user_id)
);

create or replace function public.is_store_member(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.stores s
    where s.id = target_store_id and s.owner_user_id = (select auth.uid())
  ) or exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store_id and sm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_store_manager(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.stores s
    where s.id = target_store_id and s.owner_user_id = (select auth.uid())
  ) or exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = (select auth.uid())
      and sm.role in ('owner','admin','manager')
  );
$$;

create table public.store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  domain text not null unique,
  verification_token text not null default encode(gen_random_bytes(24),'hex'),
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','failed')),
  ssl_status text not null default 'pending' check (ssl_status in ('pending','active','failed')),
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (domain = lower(domain))
);
create unique index store_domains_one_primary_idx on public.store_domains(store_id) where is_primary;

create table public.store_email_provisioning (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  provider text,
  mailbox_address text,
  provider_reference text,
  status text not null default 'not_configured' check (status in ('not_configured','pending','active','failed','cancelled')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  product_type text not null default 'physical' check (product_type in ('physical','digital','service','booking')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sku text,
  price numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  track_inventory boolean not null default false,
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  allow_backorder boolean not null default false,
  is_taxable boolean not null default true,
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  digital_asset_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,slug),
  unique(store_id,sku)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,slug)
);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  primary key(collection_id,product_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,email)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  order_number bigint generated always as identity,
  status text not null default 'pending' check (status in ('pending','payment_pending','paid','processing','fulfilled','completed','cancelled','refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','partially_refunded','refunded')),
  currency char(3) not null default 'ZAR',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(12,2) not null default 0 check (shipping_total >= 0),
  tax_total numeric(12,2) not null default 0 check (tax_total >= 0),
  grand_total numeric(12,2) not null default 0 check (grand_total >= 0),
  customer_email text not null,
  shipping_address jsonb,
  billing_address jsonb,
  customer_note text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,order_number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  product_snapshot jsonb not null default '{}'::jsonb
);

create table public.payment_provider_connections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider text not null check (provider in ('payfast','paystack','yoco','ikhokha','manual')),
  display_name text,
  merchant_reference text,
  status text not null default 'pending' check (status in ('pending','connected','disabled','error')),
  public_config jsonb not null default '{}'::jsonb,
  secret_vault_id uuid,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,provider)
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  provider text not null,
  provider_transaction_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'ZAR',
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_code text not null references public.plans(code),
  status text not null default 'trialing' check (status in ('trialing','active','past_due','cancelled','expired')),
  billing_provider text check (billing_provider in ('payfast','paystack','yoco','manual')),
  provider_customer_reference text,
  provider_subscription_reference text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_usage_monthly (
  store_id uuid not null references public.stores(id) on delete cascade,
  period_start date not null,
  products_count integer not null default 0 check (products_count >= 0),
  digital_products_count integer not null default 0 check (digital_products_count >= 0),
  bookings_count integer not null default 0 check (bookings_count >= 0),
  notification_count integer not null default 0 check (notification_count >= 0),
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  updated_at timestamptz not null default now(),
  primary key(store_id,period_start)
);

create table public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  recipient text not null,
  channel text not null check (channel in ('email','sms','whatsapp')),
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','processing','sent','failed','cancelled')),
  scheduled_for timestamptz not null default now(),
  attempts smallint not null default 0 check (attempts >= 0 and attempts <= 10),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  store_id uuid references public.stores(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare t text;
begin
  foreach t in array array['profiles','plans','stores','store_domains','store_email_provisioning','products','collections','customers','orders','payment_provider_connections','payment_transactions','store_subscriptions','store_usage_monthly','notification_queue']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.store_domains enable row level security;
alter table public.store_email_provisioning enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_provider_connections enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.store_subscriptions enable row level security;
alter table public.store_usage_monthly enable row level security;
alter table public.notification_queue enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Active plans are readable" on public.plans for select to anon, authenticated using (is_active = true);
create policy "Store members can read stores" on public.stores for select to authenticated using (public.is_store_member(id));
create policy "Store owners can create stores" on public.stores for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "Store managers can update stores" on public.stores for update to authenticated using (public.is_store_manager(id)) with check (public.is_store_manager(id));
create policy "Store owners can delete draft stores" on public.stores for delete to authenticated using (owner_user_id = (select auth.uid()) and status = 'draft');

create policy "Members can read store memberships" on public.store_members for select to authenticated using (public.is_store_member(store_id));
create policy "Managers can manage memberships" on public.store_members for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));

create policy "Public can view published store products" on public.products for select to anon, authenticated using (
  status = 'published' and exists (select 1 from public.stores s where s.id = store_id and s.status = 'published')
);
create policy "Members can view all store products" on public.products for select to authenticated using (public.is_store_member(store_id));
create policy "Managers can insert products" on public.products for insert to authenticated with check (public.is_store_manager(store_id));
create policy "Managers can update products" on public.products for update to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy "Managers can delete products" on public.products for delete to authenticated using (public.is_store_manager(store_id));

create policy "Public can view product images for published products" on public.product_images for select to anon, authenticated using (
  exists (select 1 from public.products p join public.stores s on s.id = p.store_id where p.id = product_id and p.status = 'published' and s.status = 'published')
);
create policy "Managers can manage product images" on public.product_images for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));

create policy "Public can view published collections" on public.collections for select to anon, authenticated using (
  is_published and exists (select 1 from public.stores s where s.id = store_id and s.status = 'published')
);
create policy "Members can view all collections" on public.collections for select to authenticated using (public.is_store_member(store_id));
create policy "Managers can manage collections" on public.collections for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy "Public can view collection products" on public.collection_products for select to anon, authenticated using (
  exists (select 1 from public.collections c join public.stores s on s.id = c.store_id where c.id = collection_id and c.is_published and s.status = 'published')
);
create policy "Managers can manage collection products" on public.collection_products for all to authenticated using (
  exists (select 1 from public.collections c where c.id = collection_id and public.is_store_manager(c.store_id))
) with check (
  exists (select 1 from public.collections c where c.id = collection_id and public.is_store_manager(c.store_id))
);

create policy "Members can manage customers" on public.customers for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "Members can manage orders" on public.orders for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "Members can manage order items" on public.order_items for all to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and public.is_store_member(o.store_id))
) with check (
  exists (select 1 from public.orders o where o.id = order_id and public.is_store_member(o.store_id))
);

create policy "Managers can manage store domains" on public.store_domains for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy "Managers can view email provisioning" on public.store_email_provisioning for select to authenticated using (public.is_store_manager(store_id));
create policy "Managers can manage email provisioning" on public.store_email_provisioning for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy "Managers can manage payment connections" on public.payment_provider_connections for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy "Members can view payment transactions" on public.payment_transactions for select to authenticated using (public.is_store_member(store_id));
create policy "Managers can manage payment transactions" on public.payment_transactions for all to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy "Users can view own subscriptions" on public.store_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can create own subscription request" on public.store_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Members can view store usage" on public.store_usage_monthly for select to authenticated using (public.is_store_member(store_id));
create policy "Managers can view notification queue" on public.notification_queue for select to authenticated using (public.is_store_manager(store_id));
create policy "Managers can enqueue notifications" on public.notification_queue for insert to authenticated with check (public.is_store_manager(store_id));
create policy "Managers can view audit logs" on public.audit_logs for select to authenticated using (store_id is not null and public.is_store_manager(store_id));

grant select on public.plans to anon, authenticated;
grant select, insert, update, delete on public.stores to authenticated;
grant select, insert, update, delete on public.store_members to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_images to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_products to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.store_domains to authenticated;
grant select, insert, update, delete on public.store_email_provisioning to authenticated;
grant select, insert, update, delete on public.payment_provider_connections to authenticated;
grant select on public.payment_transactions to authenticated;
grant select, insert on public.payment_transactions to authenticated;
grant select, insert on public.store_subscriptions to authenticated;
grant select on public.store_usage_monthly to authenticated;
grant select, insert on public.notification_queue to authenticated;
grant select on public.audit_logs to authenticated;
grant select, update on public.profiles to authenticated;
