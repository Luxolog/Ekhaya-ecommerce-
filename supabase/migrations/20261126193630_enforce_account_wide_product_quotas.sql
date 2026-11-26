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
  join public.stores s on s.id = p.store_id
  where s.owner_user_id = owner_id
    and (tg_op = 'INSERT' or p.id <> new.id);

  if product_count >= plan_row.max_products then
    raise exception 'Your plan allows up to % products across your stores', plan_row.max_products;
  end if;

  if new.product_type = 'digital' then
    select count(*) into digital_count
    from public.products p
    join public.stores s on s.id = p.store_id
    where s.owner_user_id = owner_id
      and p.product_type = 'digital'
      and (tg_op = 'INSERT' or p.id <> new.id);

    if digital_count >= plan_row.max_digital_products then
      raise exception 'Your plan allows up to % digital products across your stores', plan_row.max_digital_products;
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.enforce_product_plan_limits() from public, anon, authenticated;
