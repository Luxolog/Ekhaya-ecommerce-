-- Provider-neutral custom domain lifecycle and safe public hostname resolution.
alter table public.store_domains
  add column if not exists ssl_provider text,
  add column if not exists ssl_provider_hostname_id text,
  add column if not exists ssl_validation_records jsonb not null default '[]'::jsonb,
  add column if not exists dns_target text,
  add column if not exists routing_status text not null default 'pending',
  add column if not exists ssl_last_checked_at timestamptz,
  add column if not exists ssl_error text;

alter table public.store_domains
  add constraint store_domains_routing_status_check
  check (routing_status in ('pending', 'active', 'failed'));

create unique index if not exists store_domains_provider_hostname_unique
  on public.store_domains (ssl_provider, ssl_provider_hostname_id)
  where ssl_provider is not null and ssl_provider_hostname_id is not null;

create index if not exists store_domains_public_resolution_idx
  on public.store_domains (domain, verification_status, ssl_status, routing_status)
  where is_primary = true;

-- Browser sessions may add/read/remove their own domain, but may not self-assert
-- ownership, SSL or routing state. System state is written by server-only code.
revoke update on public.store_domains from authenticated;

create or replace function public.verify_store_domain_ownership(p_domain_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.store_domains d
    join public.stores s on s.id = d.store_id
    where d.id = p_domain_id and s.owner_user_id = auth.uid()
  ) then
    raise exception 'Domain not found or access denied';
  end if;

  update public.store_domains
  set verification_status = 'verified',
      verified_at = coalesce(verified_at, now()),
      updated_at = now()
  where id = p_domain_id and verification_status <> 'verified';

  return true;
end;
$$;

revoke all on function public.verify_store_domain_ownership(uuid) from public, anon;
grant execute on function public.verify_store_domain_ownership(uuid) to authenticated;

-- This narrowly scoped function exposes only a published store slug. It never
-- returns domain verification tokens, provider IDs, or merchant information.
create or replace function public.resolve_public_store_slug(p_hostname text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.slug
  from public.store_domains d
  join public.stores s on s.id = d.store_id
  where d.domain = lower(trim(trailing '.' from coalesce(p_hostname, '')))
    and d.is_primary = true
    and d.verification_status = 'verified'
    and d.ssl_status = 'active'
    and d.routing_status = 'active'
    and s.status = 'published'
    and exists (
      select 1
      from public.store_subscriptions ss
      join public.plans p on p.code = ss.plan_code
      where ss.user_id = s.owner_user_id
        and ss.status in ('active', 'trialing')
        and p.custom_domain = true
        and p.is_active = true
    )
  limit 1;
$$;

revoke all on function public.resolve_public_store_slug(text) from public;
grant execute on function public.resolve_public_store_slug(text) to anon, authenticated;

comment on column public.store_domains.ssl_provider is 'Provider adapter key used to issue and manage the hostname certificate.';
comment on column public.store_domains.ssl_provider_hostname_id is 'Provider-side custom hostname identifier; server-side only.';
comment on column public.store_domains.ssl_validation_records is 'Provider-issued DNS validation instructions; never used as a routing readiness signal.';
comment on column public.store_domains.routing_status is 'Active only after provider hostname, certificate and customer DNS target are confirmed.';
