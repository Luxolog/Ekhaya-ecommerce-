# Architecture

## Application
- Next.js App Router with TypeScript.
- Node.js server runtime for server actions, route handlers and webhook endpoints.
- Responsive merchant storefront and dashboard in one application, with tenant-aware routing.

## Backend
- Dedicated Supabase project: Postgres, Auth and Storage.
- Row Level Security is mandatory for tenant-owned data.
- Server-only service role access; never expose service-role credentials to browser code.

## Deployment
- Dedicated Vercel project for Ekhaya Ecommerce.
- Keep this project, Supabase project, environment variables and deployment separate from Ekhaya Scents and Ekhaya Price Checker.

## Reuse strategy
Reuse reviewed patterns and components from existing Ekhaya Technologies work where appropriate: authentication flows, subscription/entitlement checks, billing records, payment integration patterns, notification queues, referral logic, audit events and admin UI. Rebuild tenant isolation and data access for this product; do not copy production credentials or couple the new platform to an existing production database.

## Initial environment variables
See `.env.example`. Add the new Supabase project's values only after that project has been created.
