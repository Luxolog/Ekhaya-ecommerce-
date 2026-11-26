# Supabase database

The live Supabase project is `ekhaya-ecommerce` (`rlylfwvxxdxzmicxjbiy`).

- Region: `eu-west-1`
- Store asset bucket: `store-assets` (public image delivery; authenticated store-manager uploads)
- Tenant isolation: Row Level Security on application tables.
- Store creation: `create_store_for_current_user` checks the current user's active plan and store quota.
- Subscription records and payment transaction state are server-managed; never let a browser mark a subscription or payment as paid.

## Schema domains

- Identity: profiles
- Plans and billing: plans, store_subscriptions, store_usage_monthly
- Tenancy: stores, store_members
- Store configuration: store_domains, store_email_provisioning
- Catalogue: products, product_images, collections, collection_products
- Customers and sales: customers, orders, order_items
- Payments: payment_provider_connections, payment_transactions
- Operations: notification_queue, audit_logs

The initial schema and subsequent hardening/storage migrations are now recorded in `migrations/`, so a fresh project can be rebuilt from source.

## Security hardening

- Security helper functions are stored in the non-exposed `private` schema.
- Store creation runs as the signed-in caller and is also guarded by an RLS policy that enforces an active plan and the plan's store quota.
- Subscription and payment status are not writable by merchant browser sessions.
- The Supabase security advisor was checked after the hardening migration and returned no security lints.

- Digital product files are stored in the private `product-downloads` bucket (50 MB per file); browser access is restricted to store managers until a verified purchase/download flow is implemented.
- Public product images are stored in the `store-assets` bucket (10 MB per image); upload and mutation are restricted to store managers.
- Product and image quotas are enforced in database triggers, not only in the user interface.
