-- Keep the original store-manager policy, which already includes owners.
drop policy if exists "Store owners can view their domains" on public.store_domains;
drop policy if exists "Store owners can add their domains" on public.store_domains;
drop policy if exists "Store owners can update their domains" on public.store_domains;
drop policy if exists "Store owners can remove their domains" on public.store_domains;

-- The original schema already provides equivalent unique constraints/indexes.
drop index if exists public.store_domains_domain_unique;
drop index if exists public.store_domains_one_primary_per_store;

alter table public.store_domains
  drop constraint if exists store_domains_domain_format_check;
alter table public.store_domains
  add constraint store_domains_domain_format_check check (
    domain = lower(domain)
    and length(domain) between 4 and 253
    and domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  );

create index if not exists store_domains_store_id_idx on public.store_domains(store_id);
