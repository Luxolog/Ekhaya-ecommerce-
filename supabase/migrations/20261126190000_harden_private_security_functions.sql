create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_store_member(uuid) set schema private;
alter function public.is_store_manager(uuid) set schema private;
alter function public.handle_new_user() set schema private;

grant execute on function private.is_store_member(uuid) to authenticated;
grant execute on function private.is_store_manager(uuid) to authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop policy if exists "Store owners can create stores" on public.stores;
drop policy if exists "Store owners can create stores within plan limits" on public.stores;
create policy "Store owners can create stores within plan limits"
on public.stores for insert to authenticated
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.store_subscriptions ss
    join public.plans p on p.code = ss.plan_code
    where ss.user_id = (select auth.uid())
      and ss.status in ('active','trialing')
      and p.is_active
      and (
        select count(*) from public.stores existing
        where existing.owner_user_id = (select auth.uid())
          and existing.status <> 'archived'
      ) < p.max_stores
    order by ss.created_at desc
    limit 1
  )
);

alter function public.create_store_for_current_user(text,text,text) security invoker;
revoke all on function public.create_store_for_current_user(text,text,text) from public, anon;
grant execute on function public.create_store_for_current_user(text,text,text) to authenticated;
grant insert on public.stores to authenticated;
