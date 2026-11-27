# Hosting portability and scale-out plan

## Current deployment contract
- Runtime: Node.js 22+ (not Edge-only).
- Build: npm run build, with Next.js standalone output enabled.
- Start: node .next/standalone/server.js for a direct Node deployment, or Docker using the repository Dockerfile.
- Health: GET /api/health returns a small liveness response.
- Configuration: environment variables injected by the deployment platform at runtime.

## Provider boundaries

| Concern | Platform contract | Initial implementation | Migration rule |
| --- | --- | --- | --- |
| Web hosting | Node.js HTTP service | Vercel / standalone output | Keep route handlers Node-compatible; validate in Docker before host migration |
| Database | PostgreSQL + migrations | Dedicated Supabase project | Keep SQL portable; no Vercel database dependency |
| Authentication | Supabase Auth session contract | Supabase SSR client | Keep auth independent of hosting identity |
| Object storage | Private/public object operations | Supabase Storage | Persist object keys, not provider-generated public URLs as canonical identifiers |
| Domains | Verified hostname -> store mapping | Merchant domain table + DNS TXT ownership verification, provider adapter and secure hostname resolver | Keep provider APIs behind a server-only adapter; only verified + SSL-ready + DNS-confirmed hostnames route to published stores |
| Payments | Create/verify/refund payment contract | Gateway-specific integrations (future) | Keep gateway SDKs behind server-side adapters |
| Background jobs | Durable job record + worker | To be implemented | Critical work must not depend only on a host cron feature |
| Email | Transactional email interface | Provider to be selected | Swap provider without changing order/account workflows |

## Scale-out stages

1. Launch: one application deployment, one dedicated Supabase project, managed storage. Add usage alerts and backups before accepting paying merchants.
2. Growth: add CDN/image optimisation, database indexes, connection/pool monitoring, rate limits and queue workers. Separate long-running/background work from request handlers.
3. High traffic: horizontally scale stateless Node containers behind a load balancer; move workers to independently scalable processes; introduce caching only where data invalidation is safe.
4. Host migration: build the same commit into the same container, inject environment variables, run migrations, verify /api/health, test tenant/domain routing, then shift traffic and DNS. Keep the old deployment available for rollback.

## Required safeguards
- Never store secrets in source control or container images.
- Keep Supabase RLS as the tenant isolation boundary; do not replace it with hostname checks.
- Domain verification must prove control before activating a hostname. Reject duplicate active hostname assignments.
- Use idempotency keys for payment and job processing.
- Back up the database and test restoration; application portability does not itself make data portable.
- Test a production build and container in CI before calling a release portable.

## Custom-domain routing and SSL

The custom-domain lifecycle uses a provider-neutral interface in `src/lib/domains/provider.ts`. The first adapter is Cloudflare for SaaS custom hostnames. Provider credentials and the Supabase secret key are server-only environment variables; never expose them to browser code.

Required Cloudflare setup before activation:
- Enable Cloudflare for SaaS on the platform zone.
- Configure and activate a fallback origin that points to the Ekhaya application origin.
- Configure the customer-facing CNAME target in the same zone.
- Create an API token with the minimum required custom-hostname SSL read/write permissions.
- Set `CUSTOM_DOMAIN_SSL_PROVIDER=cloudflare`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_SAAS_CNAME_TARGET`.

Merchants keep their domain at their own registrar. They add the Ekhaya ownership TXT record, then the provider-issued hostname/SSL validation records and CNAME. The platform polls the provider and verifies that the hostname is active, the certificate is active, and the DNS CNAME points to the configured target before setting routing active. Apex domains require provider-supported flattening/proxying; the initial CNAME workflow is intended for hostnames such as `www.example.co.za` or `shop.example.co.za`.

The public hostname resolver is a narrowly scoped SQL function that returns only the slug of a published store when verification, SSL and routing are all active. Middleware rewrites the request to the existing `/s/[slug]` storefront routes. It does not bypass tenant RLS.

## Remaining infrastructure work
Provider account setup, DNS target/fallback-origin configuration, real-domain end-to-end tests, portable job queues, payment adapters and multi-region failover remain separate release milestones.
