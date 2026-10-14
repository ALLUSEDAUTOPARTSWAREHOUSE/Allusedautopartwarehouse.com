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
- Set `NEXT_PUBLIC_API_URL` to the site's absolute HTTPS production URL; Stripe Checkout uses it to create success and cancel URLs.
- Set the final public site URL and authentication callback/allowed-origin settings to the Netlify site URL first. Add a custom domain only after DNS is ready.
- Do not disable authentication to make deployment succeed.

## 3. Configure the daily scheduled job

The [Netlify scheduled function](https://docs.netlify.com/build/functions/scheduled-functions/) runs daily at **13:05 UTC** (`5 13 * * *`), matching the existing `vercel.json` schedule. Scheduled functions are activated only on a published production deploy and cannot be invoked as ordinary public URLs. The scheduled dispatcher submits the job to a protected [Netlify background function](https://docs.netlify.com/build/functions/background-functions/), which waits for `/api/cron/daily` to finish (up to 330 seconds). Background functions can run for up to 15 minutes; the dispatcher only treats an HTTP `202 Accepted` as queue acceptance, not job completion. Check the worker's function logs for the actual result.

In **Site configuration → Environment variables**, add the following with **Functions** scope and the **Production** deploy context only (not Build or All contexts):

| Variable | Value |
| --- | --- |
| `CRON_SECRET` | A strong random secret, identical to the value configured for the `/api/cron/daily` endpoint. It authenticates both the scheduled dispatcher/background worker and the endpoint. |
| `CRON_TARGET_ORIGIN` | The exact HTTPS origin of the production site, such as `https://www.example.com`, with no path or trailing slash. It must match Netlify's runtime-provided `URL`; preview/deploy URLs are rejected. |

Netlify environment variables in `netlify.toml` are build-time configuration and are not available to serverless functions. Configure these values in the Netlify account with Functions scope. The functions also require Netlify's runtime-provided [`URL`](https://docs.netlify.com/build/functions/environment-variables/), so keep the site's production URL/domain current. Never place the secret in source control or build logs.

After publishing the production deploy, use the scheduled function's **Run now** control in the Netlify UI to verify dispatch, then inspect the dispatcher and background worker function logs and the `/api/cron/daily` runtime logs. The endpoint requires bearer authentication using `CRON_SECRET` and returns `401` if the secret is missing or does not match. Worker failures are logged without an automatic application retry; check the logs and daily snapshot before manually rerunning. The job is once-a-day idempotent; a duplicate run is reported as skipped.

For a Vercel-to-Netlify cutover, first configure and verify the production Netlify environment and deployment. Avoid running both providers' schedulers at the same time: disable the Vercel cron in the Vercel account only when intentionally switching production scheduling to Netlify, and re-enable it if rolling back. This repository change does not alter Vercel account settings or remove `vercel.json`.

## 4. Verify the admin portal

After Netlify reports a successful deploy, test:

- `/admin/login` loads over HTTPS.
- Valid staff sign-in creates a secure session; invalid credentials are rejected.
- `/admin/workspace` redirects unauthenticated visitors to sign-in.
- Quote/leads, orders, inventory, customer, and staff pages load with real database data.
- Password reset/email delivery works if configured.
- API routes, file uploads, and any scheduled tasks work on the new host.
- Logs contain no missing environment variables or database connection errors.

## 5. Domain cutover

Keep the existing domain's DNS unchanged until the Netlify deployment and admin checks pass. Then add the domain in Netlify, apply the exact DNS records Netlify supplies, and verify HTTPS. Do not change MX/email DNS records.

## Important

Creating this configuration does not deploy the site or transfer secrets/data. A Netlify site must be created and connected in the Netlify account, and required environment variables and integrations must be configured there before the admin portal can work in production.
