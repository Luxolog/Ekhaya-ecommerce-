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
- Next.js App Router + TypeScript
- Node.js runtime
- Supabase (Postgres, Auth, Storage and Row Level Security)
- Vercel deployment (separate project from other Ekhaya applications)

## Local development
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add the new project's Supabase URL and anon key.
4. Run `npm run dev`.

## Important
Use a dedicated Supabase project/database for this platform. Reuse proven patterns from Ekhaya Technologies projects, not their production database or secrets.
