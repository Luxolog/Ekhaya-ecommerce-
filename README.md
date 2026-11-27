# Ekhaya Ecommerce

A multi-tenant commerce platform that helps South African small businesses launch and manage online stores.

## Product direction
- Subscription plans: R50, R100 and R199 per month.
- Each merchant manages their own store, products, orders, customers and branding.
- Merchants connect their own payment gateway accounts; Ekhaya does not pool merchant payments.
- Custom domains are connected by merchants who register and own those domains.
- Domain and professional email features are available on the R100 and R199 plans.
- Plan limits and entitlements are configurable by platform administrators.

## Stack
- Next.js App Router + TypeScript on the Node.js runtime
- Supabase (Postgres, Auth, Storage and Row Level Security), in a dedicated project
- Vercel is the initial hosting target, not a required runtime dependency

## Infrastructure independence (non-negotiable)
Ekhaya Ecommerce must remain deployable to any compatible Node.js 22+ host. Do not make Vercel-only APIs, middleware, storage, queues, cron or domain-routing features essential to business logic. Keep provider-specific integrations behind small adapters and keep merchant data in the dedicated Supabase project.

- Build output: Next.js standalone Node server.
- Container deployment: Dockerfile at the repository root.
- Runtime configuration: environment variables only; never hardcode hostnames, credentials or provider-specific URLs.
- Custom domains: resolve a verified hostname to a store using platform-owned domain records; do not rely exclusively on Vercel domain APIs.
- Files: use the configured Supabase Storage provider through a storage boundary; preserve object keys and metadata so storage can be migrated.
- Background work: use a database-backed job contract and portable workers; do not put critical business work exclusively in Vercel Cron or Edge Functions.
- Payments: keep gateway integrations behind a common payment interface; merchant payment credentials remain isolated.
- Database changes: ship versioned SQL migrations and maintain backups/restore procedures independently of the application host.

A hosting move should require infrastructure configuration, deployment and DNS changes—not a rewrite of merchant storefronts or business rules.

## Local development
1. Install Node.js 22 or newer.
2. Run npm install.
3. Copy .env.example to .env.local and configure the dedicated Supabase project.
4. Run npm run dev.

## Container build
Run:
- docker build -t ekhaya-ecommerce .
- docker run --rm -p 3000:3000 --env-file .env.local ekhaya-ecommerce

The container requires the same runtime environment variables as the Node.js deployment. Do not bake secrets into the image.

## Important
Use the dedicated Ekhaya Ecommerce Supabase project/database. Reuse proven patterns from Ekhaya Technologies projects, not their production databases or secrets. Never expose Supabase secret/service-role keys to the browser.
