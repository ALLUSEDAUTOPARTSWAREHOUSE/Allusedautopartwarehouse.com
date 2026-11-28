# AUAPW dashboard AI, assigned work and activity reporting

Prepared on 28 November 2026 for the separate branch `feature/auapw-dashboard-ai-workflows-20261128`, based on `29c6eb494a5232c5590caf58965d1569b64295c9`. This is a new change set. PR #309 is an existing model-routing prerequisite, not the PR being reused or edited.

## What is implemented

The assistant remains inside the existing AUAPW dashboard. The existing administrator assistant, `/admin/ai-workflows`, and staff portals share a reusable interface, with role-specific server endpoints and tools. The model still comes from `lib/ai/model-config.ts`; this change does not silently switch the configured provider.

| Area | Working behavior in this change |
| --- | --- |
| Products | Catalog evidence, product and feed checks, copy suggestions, existing explicit catalog approval controls. |
| Reports | Dated business/operations evidence and the new recorded-work report, with source and availability limits. |
| Sales and leads | Lead/order recommendations, assigned staff work, exact record links, and recorded workflow outcomes. |
| Orders | Recorded order lookup and audited status saves; source status remains distinct from staff-reported outcomes. |
| Support | An assistant embedded in the support portal, restricted to the signed-in person's currently assigned order/lead data. |
| Buying, disputes and reputation | Separate guidance and draft preparation based on available facts. Supplier purchasing feeds, payment-dispute providers and public-review feeds are not connected by this PR. |
| Content | Product/content drafting grounded in available catalog evidence; no automatic publication is claimed. |
| Users | Saved staff-profile creation and role-change previews, explicit approval, session-version invalidation and command history. |
| Development | Saved administrative development/regression/upgrade plans and staff planning guidance. Checks remain `not_run`; this dashboard runtime has no repository execution or deployment runner. |

Administrative roles are separate from the three staff roles. The assistant cannot grant administrator access. Creating a staff directory profile does not create a password or send an invitation; use the existing staff invitation/credential flow afterwards. See [ADMIN_COMMAND_WORKFLOWS.md](./ADMIN_COMMAND_WORKFLOWS.md) for the complete command contract.

### Example dashboard commands

- “Create a sales agent profile for [name] with email [email]. Show the exact preview for review.”
- “Find the staff member with email [email], then prepare a role change to support team.”
- “Show recorded opens, confirmed outcomes and unable-to-proceed outcomes by account, with timestamps and source links.”
- “Review my assigned leads and suggest the next follow-up from the recorded facts.”
- “Prepare a regression plan for the order-status workflow and show which checks have not run.”

Examples require the operator to provide actual intended identities. They do not pre-create demonstration staff or customer records.

## Record access and reporting

The sales portal previously called company-wide order, quote and customer queries. It now revalidates the staff session and applies active staff identity and assignment conditions in SQL before limiting records. Each tab has 50-record pagination. Customer summaries aggregate only assigned records, even when another agent handles orders for the same customer. Search and the next-page control do not widen that scope. A storage error is shown as unavailable rather than an empty workload.

Staff order projections omit invoice, email-verification and payment-session tokens. Line items contain only the explicitly supported product/price fields. Malformed omitted items are disclosed in the interface. Developer staff cannot query customer records or customer-record activity through the new endpoints.

On order and quote cards, **Open work record & report outcome** records the verified account, exact record reference and database time. Operators can report `confirmed`, `unable`, `follow_up`, `in_progress` or `closed`. These assessments do not mutate an order/lead status. Retry IDs preserve the exact original event after an uncertain response; mismatched payload reuse is rejected.

Both existing admin status-save entry points now lock the source record and commit its change and `source_status_saved` event in one PostgreSQL transaction. Missing records and audit failures roll back. An uncertain commit response is reported as uncertain. Existing email actions run only after the source transaction succeeds; tests mock delivery and send no customer messages.

`/admin/activity` provides aggregate event counts, per-account distinct-record outcome counts and the latest 200 dated events with exact order/lead links. Agent lists are limited to 100 accounts; aggregate counts use recorded history. The measurement start is the earliest recorded event, not a reconstructed historical installation time. A record may have different reported outcomes at different times; these lifetime counts are not current status or payment verification. A shared administrator login identifies that account, not the human behind it.

## Required database rollout

Use an isolated preview database first. The scripts use the `DATABASE_URL` already supplied to their process; they do not retrieve, print or embed a production connection string.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm run migrate:admin-commands
corepack pnpm run migrate:record-activity
corepack pnpm test
corepack pnpm run lint
corepack pnpm run typecheck
corepack pnpm run build
corepack pnpm run test:production
```

Review both SQL files before applying them to the intended environment. The activity migration creates activity storage, explicitly ensures the existing assignment table shape, and indexes staff assignment lookup, numeric lead-key joins and activity timelines. Orders reuse their existing text primary-key index. Index creation scans existing assignment/lead tables and should be scheduled appropriately for their size. The runner uses a transaction; these are ordinary indexes, not `CONCURRENTLY` builds.

Existing commerce tables must already contain the documented status, notes, quote amount, customer status note, status history and update-time columns. The new audited save path does not perform a broad runtime invoice-token backfill. Apply the activity migration before enabling the new status-save code: unavailable audit storage deliberately prevents an unrecorded save. Neither migration was run against a live database during development.

Configure the existing administrator/staff authentication, preview database, public URL and AI Gateway credentials in the intended environment. Do not give a preview deployment production write credentials merely to make a smoke test pass. The environment metadata response available during this review was truncated; it did not establish presence, absence or validity of the required AI Gateway production credential.

## Website and hosting findings

Source review covered the existing product/quote/checkout routes, admin order and sales workspaces, staff authentication and assignments, assistant/model configuration, activity links and build workflows. It found and fixed six existing checkout/chat/sidebar lint issues without disabling rules. A source review and local build do not establish successful live payment, invoice delivery, customer login or provider authentication.

The public storefront returned HTTP 402 with **“This deployment is temporarily paused.”** All three Vercel project checks on the starting commit reported **“Account is blocked.”** The green aggregate check said **“No required projects to validate”**; it was not a successful deployment. The exact account restriction reason is not established by those messages. The account owner must resolve the restriction through the existing Vercel account/support process before an ordinary deployment can proceed.

The earlier recovered Cloudflare staging bundle is a separate TanStack/Workers/D1 application. The specified GitHub repository is Next.js/PostgreSQL. The separately verified Cloudflare admin preview is not a deployment of this Next.js branch, and this PR does not change the staging Worker or claim to have found its exact original source repository.

## Verification and release boundary

The untouched starting commit reproduced 8 failing tests out of 96. Outdated fixture imports/source assertions were repaired while preserving behavior assertions; new tests exercise staff assignment isolation, command ownership/expiry/staleness, record retries, exact links, transaction rollback, status auditing and production build sequencing. The full updated suite passes 171 tests. Repository lint passes with 0 errors and 32 existing advisory warnings.

The complete Eve + Next.js production build, generated route types and direct TypeScript check pass locally. The smoke test found that the previous web-only build omitted the Eve server output required by `next start`. `scripts/build-production.mjs` now builds Eve before Next.js outside Vercel; on Vercel, the existing `withEve` service graph retains its separate Eve build. A failed runtime build stops the pipeline. Generated runtime output is excluded from source control and lint.

After that fix, both production servers started and all 16 HTTP smoke probes passed: login/health availability, admin/staff redirects, and HTTP 401 from protected administrative, activity, AI and Eve routes without credentials. The smoke process terminates both servers and records the results. It sends no cookies, authorization headers or model messages. Build-time warnings identify the lack of real authentication configuration in the local verification environment; no production secrets were copied into it. These checks do not establish that a live database migration, authenticated customer login, email delivery or model call succeeded.

The GitHub build verification workflow now runs regression tests, lint, generated route type checks, the complete production build and the production startup/authentication smoke test. All seven root-project workflows use Node 24, matching Eve's declared Node >=24 requirement, the Vercel project runtime, and the local Node 24.22.3 verification. This also supports the SQLite-backed access-control fixtures. Release still requires the reviewed migrations, correct environment configuration, an unblocked hosting account, and an authenticated preview smoke test with an authorized test identity. This change does not claim automatic purchases, refunds, customer messaging, content publication or self-deployment by AI.
