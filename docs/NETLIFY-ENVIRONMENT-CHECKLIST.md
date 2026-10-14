# AUAPW Netlify Environment and Cutover Checklist

Use this checklist when connecting the existing repository to Netlify. Do not create a Vercel project as part of this process.

## Netlify site settings

- Repository: `ALLUSEDAUTOPARTSWAREHOUSE/Allusedautopartwarehouse.com`
- Production branch: `main`
- Build command: `pnpm build`
- Package manager: pnpm `9.15.9` (lockfile is committed)
- Node.js: `22`
- Publish directory: leave Netlify's Next.js framework/runtime integration to configure it; do not force a static export for this application.
- Configuration file: `netlify.toml`

The application uses Next.js server routes and server-side authentication. A static-only export is not an appropriate deployment target.

## Configure secrets in Netlify

Use **Site configuration → Environment variables**. Transfer values from the authoritative password manager/current production configuration; never commit values to the repository or paste secrets into issues or pull requests.

### Authentication variables confirmed in source

- `ADMIN_PASSWORD`: required for the environment-variable-based administrator login. Use a strong unique password. There is intentionally no production fallback password.
- `ADMIN_EMAIL`: optional administrator login email; source default is `Info@Allusedautopartswarehouse.com`.
- `BETTER_AUTH_SECRET` or `ADMIN_SESSION_SECRET`: set a strong random session-signing secret in production. Do not rely on the password-derived fallback when moving hosts.
- Staff login also relies on the application's database and staff credential/session implementation.

### Application integrations

Inspect the current production environment and source code before transferring each value. Configure only the integrations that the business actually uses:

- PostgreSQL/database connection settings and any required SSL options.
- Email provider credentials and sender/domain verification for password reset and notifications.
- Payment provider keys and webhook signing secrets, if payment flows are enabled.
- Any AI, analytics, messaging, storage, or third-party API keys used by enabled routes.

Do not guess variable names or copy preview-only values. Keep production and deploy-preview values separate. Restrict secrets to server-side use; do not prefix secrets with `NEXT_PUBLIC_`.

## Before connecting the custom domain

1. Deploy the Netlify site on its generated hostname first.
2. Verify build logs and confirm server-side API routes work.
3. Test admin and staff login, logout, expired sessions, and unauthorized access.
4. Verify database-backed Quotes & Leads, Orders, Inventory, Customers, and Team Directory actions.
5. Test password-reset and notification email delivery end to end.
6. Verify payment webhooks and other external callback URLs if applicable.
7. Confirm uploaded files, scheduled jobs, and any long-running tasks are supported by the selected Netlify runtime.
8. Check security headers, HTTPS, cookies, allowed origins, and provider callback URLs.
9. Only after all checks pass, add the custom domain in Netlify and apply the exact DNS records shown by Netlify. Preserve MX and other email DNS records.

## Important deployment notes

- This repository includes server-side Next.js route handlers and a PostgreSQL dependency. Verify Netlify's current Next.js runtime and database connectivity before production cutover.
- `netlify.toml` configures the build, but it does not create a Netlify site, transfer secrets, provision a database, or deploy the application.
- Do not change the current domain's DNS until the Netlify-hosted application passes the full smoke test.
- If the CI preflight fails, fix the reported source or test issue before attempting the cutover.
