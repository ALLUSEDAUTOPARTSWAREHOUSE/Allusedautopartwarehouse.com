# Admin command workflows

This change extends the existing dashboard assistant with named department guidance, actual staff directory lookup, reviewable staff commands, and saved development/regression plans. It uses the existing administrator session and PostgreSQL staff directory. It does not replace authentication or use the Cloudflare staging database.

## Commands and results

| Request | Behavior |
| --- | --- |
| Create a sales, support, or developer user | Prepare an exact staff-profile preview. The authenticated administrator reviews and approves it. Approval creates one active directory profile. It does not create a password, sign the person in, or send an invitation. |
| Upgrade or change a staff role | Search the existing directory, resolve the exact staff ID, and prepare a preview showing the current and requested roles. Approval updates that same profile and increments the credential session version. |
| Run a regression or development task | Save an auditable plan containing scope and required checks. Its execution status remains `not_run`; no shell, repository sandbox, CI runner, or deployment executor is connected to this assistant runtime. |
| Check a command or report | Read the stored status and audit events. Only `completed` is evidence that a staff mutation occurred. Reports use existing metrics, operations, catalog and feed-history tools with their source and date limits. |

Supported staff roles are `sales_agent`, `support_team`, and `developer_team`. They are separate from administrator credentials and Better Auth customer accounts. Administrator access cannot be granted by these commands. Invitation delivery remains the existing explicit action on the Staff page.

## Approval boundary

The model can prepare a command but has no execution tool. Preparation stores the validated payload and a server-generated preview, owned by the current administrator email, with a 15-minute review window. The UI submits only an approve/deny decision to the dedicated command endpoint. It cannot submit replacement names, roles, or mutation arguments.

Every service operation reads the current server session. The approval endpoint additionally checks same-origin JSON requests and a bounded body. Approval obtains a row lock on the stored command. A role change locks and checks the actual staff record against the saved fingerprint; a changed target requires a fresh preview. Duplicate staff emails are rechecked at approval time. A completed decision is idempotent, and denial, expiry, or stale state cannot be revived by replaying an approval.

The staff mutation, command result, and command audit event are committed in one PostgreSQL transaction. Audit persistence failure rolls back the mutation. An uncertain network response should be resolved with the command's GET endpoint before trying another request. Stored command history is limited to the same authenticated administrator identity.

## Database setup

Review `scripts/admin-commands.sql`, then run `node scripts/migrate-admin-commands.mjs` against the intended database using its existing `DATABASE_URL` configuration. The migration is explicit and is not invoked from request handlers or application startup. It creates command and event tables and ensures the existing `staff_credentials` table shape needed for session-version invalidation. It does not create or change staff profiles.

Until the reviewed migration has been applied, staff command preparation returns a clear storage-unavailable error. Existing read-only assistant tools remain available. Never test a migration against production merely to verify SQL syntax.

## Audited order and lead saves

Both existing follow-up forms and the operations PATCH endpoint now save order/lead changes and a `source_status_saved` activity event in one PostgreSQL transaction. The transaction locks the exact source row, preserves existing order history/customer-note behavior, applies the submitted fields, writes the event through that same client, and commits. Missing records or audit-storage failures cannot produce a successful save. A lost commit acknowledgment is reported as uncertain and directs the user to refresh the record and activity history before retrying.

The activity identity comes from the authenticated administrator session and uses the normalized email for a stable account ID. Request fields cannot choose the recorded actor. The event stores the record type, record ID and saved status; internal notes, customer messages, payment tokens and other customer details are not copied into the audit event. A save that keeps the same status can still update notes and is counted as a source save, rather than an inferred status transition. Customer emails retain their existing conditions and run only after the audited save commits. The operations API does not send customer emails.

Before enabling these writes, review and explicitly apply `scripts/record-activity.sql` using `node scripts/migrate-record-activity.mjs` against the intended database. This is separate from the admin-command migration. The existing commerce schema must also contain `public.orders.status`, `internal_notes`, `customer_status_note`, JSONB `status_history`, and `updatedat`, plus `public.leads.status`, `internal_notes`, `quote_amount`, and `updated_at`. This change does not run a commerce migration automatically or claim those columns are provisioned by the activity migration. The audited mutation path no longer runs the broad invoice-column/token backfill; existing read/create/payment paths are unchanged.

Missing required tables or columns return a clear schema-unavailable error and roll back the submitted follow-up change. Apply the reviewed schema before rollout; otherwise existing follow-up saves intentionally remain unavailable instead of producing unrecorded changes.

## Department evidence

Reports, Products, Sales/Leads, Orders, Support, Buying, Disputes, Reputation, Content, Users, and Development have distinct guidance and tool lists. The guides describe available evidence rather than granting permissions. Supplier offer/purchase-order feeds, payment-dispute provider feeds, and public review channels remain unconnected; their guides explicitly say so. Product copy and customer responses remain drafts. Existing catalog visibility and feed-exclusion tools retain their explicit SDK approval controls.

The Reports and Sales guides also connect to `getRecordedWorkReport`, backed by the separate record-activity feature. It returns actual record-open events, staff-reported workflow outcomes, and saved source changes, with per-account counts and timestamps. Its model-facing projection omits freeform notes and internal actor IDs. The latest-event and agent lists are capped, while aggregate totals cover stored history from the measurement start. A reported `confirmed` outcome is not proof of payment or the record's current status. Shared admin credentials identify the account rather than an individual person. Events before instrumentation was enabled are not reconstructed; missing storage returns unavailable instead of invented zero totals.

## Verification

The focused regression suite is `node --test scripts/admin-commands.test.cjs`. It checks strict roles and payloads, preparation without mutation, administrator ownership, expiry/denial, stale previews, idempotent approvals, session-version invalidation, transactional audit failure, honest development plans, and endpoint origin/body controls. Its transaction fixture exercises application behavior but is not a substitute for validating the reviewed SQL against an isolated PostgreSQL database before rollout.

`node --test scripts/followup-audit.test.cjs scripts/record-activity.test.cjs` checks source/audit rollback, missing records, concurrent history behavior, stable actor attribution, migration failures, uncertain commit responses, activity privacy and the existing notification conditions. These tests use local SQLite fixtures with narrowly translated PostgreSQL syntax and mocked email delivery. They do not contact customers or a live database and do not replace isolated PostgreSQL migration verification.

Run the repository's full test, type-check, lint, and build checks before deployment. Record actual outputs separately from assistant-generated plans. The staff invitation and login flows should be exercised with an authorized test identity in a nonproduction deployment after migration.
