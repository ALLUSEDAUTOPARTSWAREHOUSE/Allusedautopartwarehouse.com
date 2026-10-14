# AUAPW Admin Portal — Netlify Hosting Setup

This project is a Next.js application. This guide deploys it to Netlify and does not create or connect a Vercel project.

## 1. Create the Netlify site

1. Sign in to Netlify and choose **Add new site → Import an existing project**.
2. Connect GitHub and select `ALLUSEDAUTOPARTSWAREHOUSE/Allusedautopartwarehouse.com`.
3. Select the `main` branch for production.
4. Use the repository's `netlify.toml` build settings. Netlify's Next.js runtime handles routing and server-rendered routes. Do not configure a static export.

## 2. Configure environment variables

Before publishing, open **Site configuration → Environment variables** and add the production values required by the application. Use the project's existing deployment configuration and secret manager as the source of truth.

- `DATABASE_URL`: required by the PostgreSQL connection pool in `lib/db/index.ts`. Verify that the database accepts connections from the Netlify runtime and apply the database provider's required SSL options.
- `ADMIN_PASSWORD`: configure a strong unique administrator password if using environment-based admin login; there is no production fallback password.
- `ADMIN_EMAIL`: optional administrator login email; the source default is `Info@Allusedautopartswarehouse.com`.
- `BETTER_AUTH_SECRET` or `ADMIN_SESSION_SECRET`: configure a strong random session-signing secret for production.
- Email provider credentials and sender/domain verification for password reset and notifications, if those features are enabled.
- `STRIPE_SECRET_KEY` and webhook signing secrets, if payment features are enabled.
- Other integration keys only when source code and enabled features confirm they are needed.

- Never commit real secrets to GitHub.
- Do not reuse a Vercel-only environment configuration automatically; copy values deliberately and confirm each provider supports the new deployment URL.
- Set the final public site URL and authentication callback/allowed-origin settings to the Netlify site URL first. Add a custom domain only after DNS is ready.
- Do not disable authentication to make deployment succeed.

## 3. Verify the admin portal

After Netlify reports a successful deploy, test:

- `/admin/login` loads over HTTPS.
- Valid staff sign-in creates a secure session; invalid credentials are rejected.
- `/admin/workspace` redirects unauthenticated visitors to sign-in.
- Quote/leads, orders, inventory, customer, and staff pages load with real database data.
- Password reset/email delivery works if configured.
- API routes, file uploads, and any scheduled tasks work on the new host.
- Logs contain no missing environment variables or database connection errors.

## 4. Domain cutover

Keep the existing domain's DNS unchanged until the Netlify deployment and admin checks pass. Then add the domain in Netlify, apply the exact DNS records Netlify supplies, and verify HTTPS. Do not change MX/email DNS records.

## Important

Creating this configuration does not deploy the site or transfer secrets/data. A Netlify site must be created and connected in the Netlify account, and required environment variables and integrations must be configured there before the admin portal can work in production.
