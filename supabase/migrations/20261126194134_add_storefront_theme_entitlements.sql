alter table public.plans
  add column if not exists theme_access text[] not null default array['minimal','retail'],
  add column if not exists advanced_theme_customization boolean not null default false;

update public.plans
set theme_access = case code
  when 'starter' then array['minimal','retail']
  when 'business' then array['minimal','luxury','boutique','retail','beauty']
  when 'growth' then array['minimal','luxury','boutique','retail','beauty']
  else array['minimal','retail']
end,
advanced_theme_customization = code in ('business','growth');

comment on column public.plans.theme_access is 'Theme identifiers available to an account on this plan.';
comment on column public.plans.advanced_theme_customization is 'Whether the plan can customise storefront brand colours.';
