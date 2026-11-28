-- Add the three new industry themes to Business and Growth entitlements.
-- Starter remains unchanged: Minimal and Everyday Retail only.
update public.plans
set theme_access = array[
  'minimal','luxury','boutique','retail','beauty',
  'driving','insurance','household'
]
where code in ('business','growth');

comment on column public.plans.theme_access is
  'Theme identifiers available to an account on this plan. Includes driving, insurance and household industry themes on Business and Growth.';
