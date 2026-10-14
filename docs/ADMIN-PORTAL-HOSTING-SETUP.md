# AUAPW Admin Portal — Netlify Hosting Setup

This project is a Next.js application. This guide deploys it to Netlify and does not create or connect a Vercel project.

## 1. Create the Netlify site

1. Sign in to Netlify and choose **Add new site → Import an existing project**.
2. Connect GitHub and select `ALLUSEDAUTOPARTSWAREHOUSE/Allusedautopartwarehouse.com`.
3. Select the `main` branch for production.
4. Use the repository's `netlify.toml` build settings. Netlify's Next.js runtime handles routing and server-rendered routes.

## 2. Configure environment variables

Before publishing, open **Site configuration → Environment variables** and add the production values required by the application. Use the project's existing deployment configuration and secret manager as the source of truth. In particular, verify database connection settings, authentication/session secrets, email delivery credentials, and any payment-provider keys used by enabled features.

- Never commit real secrets to GitHub.
- Do not reuse a Vercel-only environment configuration automatically; copy values deliberately and confirm each provider supports the new deployment URL.
- Set the final public site URL and authentication callback/allowed-origin settings to the Netlify site URL first. Add a custom domain only after DNS is ready.
- Do not disable authentication to make deployment succeed.
- Set `CRON_SECRET` in Netlify's production environment variables; the scheduled workflow must use the same value.

## 3. Verify the admin portal

After Netlify reports a successful deploy, test:

- `/admin/login` loads over HTTPS.
- Valid staff sign-in creates a secure session; invalid credentials are rejected.
- `/admin/workspace` redirects unauthenticated visitors to sign-in.
- Quote/leads, orders, inventory, customer, and staff pages load with real database data.
- Password reset/email delivery works if configured.
- API routes, file uploads, and any scheduled tasks work on the new host.
- Logs contain no missing environment variables or database connection errors.

## 4. Configure daily automation

The daily feed-health snapshot, Stripe reconciliation, owner report, and log cleanup run through `/api/cron/daily`. Netlify does not run the Vercel cron in `vercel.json`, so the repository's scheduled GitHub Actions workflow calls this endpoint daily at 13:05 UTC.

1. In **GitHub repository Settings → Secrets and variables → Actions**, add `NETLIFY_SITE_URL` as a variable containing the production HTTPS site URL (for example, `https://your-site.netlify.app`).
2. Add `CRON_SECRET` as a GitHub Actions secret, using the same value configured in Netlify's production environment variables.
3. Set the `DAILY_CRON_ENABLED` GitHub Actions variable to `true` after the site and both credentials are ready. This enables the scheduled workflow and its manual **Run workflow** option.
4. Run the workflow manually once and verify it succeeds; then confirm the daily report and feed-health snapshot in the admin portal.

Update `NETLIFY_SITE_URL` if the production domain changes. Keep `DAILY_CRON_ENABLED` unset or set to another value until the production URL and credentials are configured.

## 5. Domain cutover

Keep the existing domain's DNS unchanged until the Netlify deployment and admin checks pass. Then add the domain in Netlify, apply the exact DNS records Netlify supplies, and verify HTTPS. Do not change MX/email DNS records.

## Important

Creating this configuration does not deploy the site or transfer secrets/data. A Netlify site must be created and connected in the Netlify account, and required environment variables and integrations must be configured there before the admin portal can work in production.
