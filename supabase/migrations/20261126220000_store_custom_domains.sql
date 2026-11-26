create table if not exists public.store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  domain text not null,
  verification_token text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'active', 'failed')),
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_domains_domain_format check (
    domain = lower(domain)
    and length(domain) between 4 and 253
    and domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  )
);

create unique index if not exists store_domains_domain_unique on public.store_domains (domain);
create unique index if not exists store_domains_one_primary_per_store on public.store_domains (store_id) where is_primary = true;
create index if not exists store_domains_store_id_idx on public.store_domains (store_id);

alter table public.store_domains enable row level security;
grant select, insert, update, delete on public.store_domains to authenticated;

drop policy if exists "Store owners can view their domains" on public.store_domains;
create policy "Store owners can view their domains" on public.store_domains
for select to authenticated using (
  exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid()))
);

drop policy if exists "Store owners can add their domains" on public.store_domains;
create policy "Store owners can add their domains" on public.store_domains
for insert to authenticated with check (
  exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid()))
);

drop policy if exists "Store owners can update their domains" on public.store_domains;
create policy "Store owners can update their domains" on public.store_domains
for update to authenticated using (
  exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid()))
);

drop policy if exists "Store owners can remove their domains" on public.store_domains;
create policy "Store owners can remove their domains" on public.store_domains
for delete to authenticated using (
  exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid()))
);

comment on table public.store_domains is 'Merchant-owned custom domain mappings and DNS ownership verification. Host activation and TLS provisioning are separate infrastructure steps.';
