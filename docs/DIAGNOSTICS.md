# Production Diagnostics

Where to look when something fails in production. No extra observability
stack exists or is needed at beta scale — the diagnostic surfaces are:

1. **Vercel runtime logs** — Vercel → your project → **Logs** (or a
   deployment → Runtime Logs). Every server-side failure is logged here
   with a greppable prefix (see table). Filter by the prefix or by the
   request path.
2. **Vercel build logs** — a deployment that never went live failed here.
3. **The `audit_log` table** — the governance record. Every successful
   listing transition, watchlist change, valuation run, and verification
   decision writes a row. If an action "didn't happen", check whether its
   audit row exists: no row = the server action failed (see logs);
   row present = it happened, look at what the user saw instead.
   ```sql
   SELECT action, entity_id, actor_user_id, created_at
   FROM audit_log ORDER BY created_at DESC LIMIT 50;
   ```
4. **The database itself** — `psql "<prod-url>"` for row-level truth, and
   `pnpm db:status` (read-only) for schema/migration state.
5. **Railway** — Postgres service → Metrics (connections, CPU) and
   Observability/logs for database-side errors.

## Symptom → where to look

| Symptom | First check | Notes |
|---|---|---|
| Signup fails | Vercel logs around `/api/auth/sign-up`; then `rate_limit` | 429 + "Too many attempts" = rate limiter (10/min per IP on credential routes — shared office IPs can trip it). "Account exists" = duplicate email. Boot-time `Invalid environment configuration` = missing `BETTER_AUTH_SECRET`/`DATABASE_URL`. |
| Login fails | Same as signup (`/api/auth/sign-in`) | Wrong password shows a friendly error by design. If *nobody* can sign in after a redeploy: check `BETTER_AUTH_URL` matches the real origin and `BETTER_AUTH_SECRET` didn't change scope (changing it invalidates all sessions). "Invalid origin" in logs → §Vercel origins below. |
| Company creation fails | Vercel logs for the `/founder/onboarding/new` server action | Validation errors render in the form (not a failure). Unique-slug retries are handled; a hard failure logs with a stack. |
| Listing submission fails | Form error text first; then Vercel logs; then `audit_log` for `company.submitted` | "Missing required information" lists exactly which fields; that is the product working. |
| Admin approval / send-back / publish fails | `[admin-review]` in Vercel logs; `audit_log` for `company.approved` / `company.rejected` | "This company is not in a reviewable state" = a concurrent transition won (refresh the page). Send-back/unpublish REQUIRE a founder note ≥10 chars. |
| Publishing succeeded but company not public | `companies.status` and `published_at` in DB; then whether `is_demo` is true | Public reads require `status='published'`; demo rows never show in production. |
| Search / Discover fails or looks empty | Vercel logs for `/companies`; then DB: `SELECT count(*) FROM companies WHERE status='published' AND is_demo=false;` | Zero real published companies renders the designed empty state — not a bug. Invalid query params fall back safely by design. |
| Watchlist save fails | `[watchlist]` in Vercel logs; `audit_log` for `watchlist.saved` | Saves work only on published, non-demo companies; anything else returns "not available" by design. |
| Valuation generate fails | `[valuation]` in Vercel logs | "Generated recently" = the 10-minute cooldown, not a failure. |
| Verification actions fail | `[verification]` in Vercel logs | Reject/needs-update require a founder note. |
| Feedback fails | `[feedback]` in Vercel logs | 10/day per-user cap returns a friendly message. |
| Database connection fails | Vercel logs (connection refused/timeout/SSL); Railway service status; connection count on Metrics | Verify `DATABASE_URL` has `?sslmode=require` and the Railway service is up. Pool exhaustion at scale: lower `DB_POOL_MAX` (see DEPLOYMENT.md §9). |
| Any page shows the generic error screen | Vercel logs at that timestamp | `src/app/error.tsx` logs the underlying error server-side; users never see stack traces. |
| Usage numbers look wrong on `/admin` | `product_events` table | Events are fire-and-forget: insert failures log `[product-events]` and undercount silently — they never break pages. |

## Log prefixes (grep keys for Vercel logs)

`[admin-review]` · `[verification]` · `[watchlist]` · `[valuation]` ·
`[feedback]` · `[audit]` · `[product-events]`

## Vercel origin errors

"Invalid origin" auth errors mean the request's host isn't trusted. Trusted
origins are: `BETTER_AUTH_URL` plus the deployment's own
`VERCEL_URL`/`VERCEL_BRANCH_URL`/`VERCEL_PROJECT_PRODUCTION_URL`
(`src/lib/auth-origins.ts`). Fix: confirm "Automatically expose System
Environment Variables" is ON and `BETTER_AUTH_URL` matches the origin users
actually visit (custom domain included), then redeploy.

## Password resets (operational, until email exists)

There is no self-service reset and no supported operator command to set a
user's password. A locked-out user with no data (typically an investor) can
be handled by deleting their `user` row after out-of-band identity
verification — cascades clean up sessions and watchlist — and having them
re-register with the same email. A locked-out **founder** cannot be deleted
(the DB deliberately RESTRICTs deleting users who own companies); treat
that as a support incident with no clean fix today. Mitigations: tell
invitees up front to use a password manager, keep the first cohort small,
and prioritize the email/password-reset work (see the Phase 3.6 report's
email recommendation) as the first post-launch improvement.
