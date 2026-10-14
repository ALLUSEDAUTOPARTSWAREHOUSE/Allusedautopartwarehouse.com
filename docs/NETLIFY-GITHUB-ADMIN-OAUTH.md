# AUAPW GitHub Admin Sign-in (Netlify)

GitHub sign-in is an additional option for the existing administrator login. The email/password and staff sign-in endpoint is unchanged. GitHub OAuth grants the **admin** workspace only to account IDs explicitly listed in `GITHUB_ADMIN_ALLOWED_IDS`; do not list general staff or customers.

## 1. Register the GitHub OAuth App

In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**.

- **Application name:** AUAPW Admin Portal
- **Homepage URL:** `https://www.allusedautopartswarehouse.com`
- **Authorization callback URL:** `https://www.allusedautopartswarehouse.com/api/portal/auth/github/callback`

The callback must match the canonical public origin configured for production. For initial testing on a Netlify site URL, use that exact HTTPS site URL in both the OAuth app and `AUAPW_PUBLIC_URL`. Change the OAuth app callback only when deliberately switching the configured public origin.

## 2. Set Netlify environment variables

In Netlify, open **Site configuration → Environment variables** and configure these for the deploy contexts that should allow admin sign-in:

| Variable | Value |
| --- | --- |
| `AUAPW_PUBLIC_URL` | Canonical HTTPS origin, e.g. `https://www.allusedautopartswarehouse.com` (no path) |
| `GITHUB_CLIENT_ID` | Client ID copied from the GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | Client Secret from the GitHub OAuth App; store only in Netlify |
| `GITHUB_ADMIN_ALLOWED_IDS` | Comma-separated numeric GitHub account IDs authorized for admin sign-in |
| `ADMIN_EMAIL` | Existing administrator email shown in the admin session |
| `BETTER_AUTH_SECRET` or `ADMIN_SESSION_SECRET` | Strong random session-signing secret already required by the portal |

Do not put real values in Git, commits, pull-request comments, or chat. Do not use a public `NEXT_PUBLIC_*` variable for the client secret. Never enable GitHub sign-in by leaving the allowlist empty or by allowing all GitHub users.

## 3. Verify after deploy

1. Open `/admin/login`; the existing email/password form must still be available.
2. Click **Continue with GitHub** and confirm GitHub returns to the exact callback URL above.
3. A GitHub account ID in `GITHUB_ADMIN_ALLOWED_IDS` should reach `/admin/workspace`.
4. A different account ID, OAuth cancellation, missing configuration, or invalid state must not create an admin session.
5. Confirm the admin session cookie is HTTP-only, Secure on production HTTPS, SameSite=Lax, and expires after the configured session lifetime.

This change does not create the GitHub OAuth App, populate Netlify variables, deploy the site, or change DNS. Complete those steps separately. Keep existing email/password access until the GitHub flow has been tested on the Netlify deployment.
