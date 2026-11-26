drop policy if exists "Store owners can create stores" on public.stores;
drop policy if exists "Members can read stores" on public.stores;
create policy "Public can view published stores" on public.stores
for select to anon, authenticated using (status = 'published');
create policy "Members can view their stores" on public.stores
for select to authenticated using (public.is_store_member(id));

create or replace function public.create_store_for_current_user(
  store_name text,
  store_slug text,
  store_description text default null
)
returns public.stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  selected_plan public.plans%rowtype;
  created_store public.stores%rowtype;
  store_count integer;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select p.* into selected_plan
  from public.store_subscriptions ss
  join public.plans p on p.code = ss.plan_code
  where ss.user_id = uid and ss.status in ('active','trialing')
  order by ss.created_at desc
  limit 1;

  if not found then
    raise exception 'An active subscription is required before creating a store' using errcode = 'P0001';
  end if;

  select count(*) into store_count
  from public.stores s
  where s.owner_user_id = uid and s.status <> 'archived';

  if store_count >= selected_plan.max_stores then
    raise exception 'Your current plan store limit has been reached' using errcode = 'P0001';
  end if;

  insert into public.stores(owner_user_id,name,slug,description)
  values (uid, trim(store_name), lower(trim(store_slug)), store_description)
  returning * into created_store;

  return created_store;
end;
$$;

revoke all on function public.create_store_for_current_user(text,text,text) from public, anon;
grant execute on function public.create_store_for_current_user(text,text,text) to authenticated;

drop policy if exists "Users can create own subscription request" on public.store_subscriptions;
revoke insert, update, delete on public.store_subscriptions from authenticated;
grant select on public.store_subscriptions to authenticated;

drop policy if exists "Managers can manage payment transactions" on public.payment_transactions;
revoke insert, update, delete on public.payment_transactions from authenticated;
grant select on public.payment_transactions to authenticated;
