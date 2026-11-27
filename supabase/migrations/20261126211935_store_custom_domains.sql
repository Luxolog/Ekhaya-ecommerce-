-- store_domains was introduced in the initial platform schema.
-- This migration documents the domain ownership table hardening added in this release.
create index if not exists store_domains_domain_unique on public.store_domains (domain);
create unique index if not exists store_domains_one_primary_per_store on public.store_domains (store_id) where is_primary = true;
create index if not exists store_domains_store_id_idx on public.store_domains (store_id);

alter table public.store_domains enable row level security;
grant select, insert, update, delete on public.store_domains to authenticated;

drop policy if exists "Store owners can view their domains" on public.store_domains;
create policy "Store owners can view their domains" on public.store_domains for select to authenticated
using (exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid())));

drop policy if exists "Store owners can add their domains" on public.store_domains;
create policy "Store owners can add their domains" on public.store_domains for insert to authenticated
with check (exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid())));

drop policy if exists "Store owners can update their domains" on public.store_domains;
create policy "Store owners can update their domains" on public.store_domains for update to authenticated
using (exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid())));

drop policy if exists "Store owners can remove their domains" on public.store_domains;
create policy "Store owners can remove their domains" on public.store_domains for delete to authenticated
using (exists (select 1 from public.stores s where s.id = store_domains.store_id and s.owner_user_id = (select auth.uid())));
