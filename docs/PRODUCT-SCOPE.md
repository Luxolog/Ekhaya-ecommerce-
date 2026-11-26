# Ekhaya Ecommerce — Product Scope

## Product
A subscription-based, multi-tenant ecommerce platform for small businesses, with an initial South African market focus.

## Commercial model
Monthly plans accepted:
- **Starter — R50:** one store, up to 10 products, up to 3 images per product, up to 2 digital products, up to 10 bookings per month, standard templates/basic builder and analytics, basic marketing, one team member. No custom domain or customer accounts.
- **Business — R100:** one store, up to 50 products, up to 8 images per product, up to 20 digital products, up to 100 bookings per month, all templates/advanced builder and analytics, custom domain connection, customer accounts, standard marketing, two team members.
- **Growth — R199:** up to 3 stores, up to 500 products, up to 10 images per product, up to 100 digital products, up to 500 bookings per month, advanced builder/analytics/marketing, custom domain connection, customer accounts, five team members.

R100 and R199 include one professional email address and plan-based notifications. WhatsApp Business notifications may be offered where the merchant's connected WhatsApp Business setup and messaging costs preserve platform profitability. Notification allowances, channels and plan limits must be configurable by the platform administrator before launch.

All quotas and entitlements must be database-driven and editable by an administrator. The public pricing page is an initial presentation and must be aligned with the final admin-managed entitlement matrix before launch.

## Merchant-owned services
- Merchants register and own their own domains with their chosen registrar. The platform provides domain connection instructions and verification; it does not silently register domains on behalf of merchants.
- Merchants connect their own payment gateway accounts. Gateway credentials must be stored securely server-side, never exposed in client code, and isolated by tenant. Customer payments settle directly to the merchant's gateway account.
- Professional email provisioning/forwarding must be integrated with a provider only after provider, cost and mailbox capability are confirmed. Never promise an actual mailbox before provisioning is implemented.
- WhatsApp is an optional channel subject to provider approval, template rules and per-message cost controls.

## Core platform modules
1. Public marketing site, pricing and registration.
2. Authentication, email verification and merchant onboarding.
3. Business profile, store creation, branding, store URL and publish controls.
4. Storefront themes and page builder.
5. Product catalogue: physical, digital and service/bookable products.
6. Cart, checkout, order management and customer accounts.
7. Merchant payment gateway settings and webhook processing.
8. Custom domain connection and verification.
9. Transactional email and configurable notification centre.
10. Subscription billing, plan entitlements, usage metering and upgrade/downgrade handling.
11. Merchant dashboard, analytics and team access.
12. Platform administration, merchant approvals, support tools, audit log and configurable plan limits.

## Security and tenancy
- Dedicated Supabase project and database for this platform; do not share production databases or secrets with other Ekhaya apps.
- Every tenant-owned row must include a tenant/store relationship and be protected by Supabase Row Level Security.
- Verify tenant ownership server-side for every privileged operation.
- Keep payment secrets server-side; encrypt sensitive provider credentials at rest.
- Verify webhook signatures and make payment/order webhook handlers idempotent.
- Maintain audit events for sensitive account, billing, payment and admin actions.
- Apply POPIA-aware data minimisation, retention and consent practices.

## MVP delivery sequence (target: 14 days)
1. Foundation: Next.js app, Supabase project wiring, schema and RLS.
2. Authentication and merchant onboarding.
3. Store setup and public storefront.
4. Products, cart, checkout and orders.
5. Merchant-owned payment gateway integration.
6. Subscription enforcement, admin controls and pilot hardening.

The 14-day target is an MVP target, not a promise that every module in the complete product scope will be production-ready in that period. The broader complete platform is a longer phased build.

## Current implementation checkpoint

Implemented in the repository and dedicated Supabase project:
- Merchant registration, login, email confirmation callback and dashboard.
- Store creation with subscription quota checks.
- Product catalogue list, create and edit screens.
- Physical, digital, service and bookable product types.
- Product descriptions, category, SKU, barcode, pricing, reference cost and stock fields.
- Product image upload with per-plan image limits.
- Private digital product file uploads (up to 50 MB) with store-manager-only access.
- Database triggers enforce per-plan product, digital-product and image quotas.
- Product image records are constrained to the same store as their product.
- Product data and uploaded files are protected by tenant-aware RLS policies.

Not yet implemented:
- Customer-facing storefront rendering and product detail pages.
- Public category/collection browsing.
- Product variants and options.
- Booking calendars, appointment availability and booking fulfilment.
- Customer digital-download delivery after verified payment.
- Cart, checkout, payment processing and order fulfilment.
- Subscription checkout and platform administration.

Product and digital-product quotas are enforced across all stores owned by the merchant account. Image limits apply per product.


## Storefront theme system

- Theme studio route: `/dashboard/stores/[storeId]/design`.
- Five initial themes: Minimal, Everyday Retail, Luxury, Fashion Boutique, and Beauty & Lifestyle.
- Starter includes Minimal and Everyday Retail.
- Business and Growth include all five themes.
- Business and Growth can customise accent, background, and text colours; all plans can set a homepage headline.
- Theme selection and appearance are saved under the store's existing `settings.storefront` JSON object, keeping configuration isolated per store.
- Theme updates use the authenticated server-side Supabase client and store-manager RLS. The API validates theme IDs, plan entitlement, and colour values.
- The current milestone delivers the theme library, selection, saved configuration and preview studio. Public storefront rendering with these theme components is the next storefront implementation step.
