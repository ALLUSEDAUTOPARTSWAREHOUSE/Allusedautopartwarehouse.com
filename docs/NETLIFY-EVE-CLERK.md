# AUAPW Eve custom channel — Netlify

This change secures the website's Eve HTTP channel with Clerk session tokens. It does not replace AUAPW customer, admin, or staff authentication.

## Clerk custom channel configuration

In the existing Clerk application selected for AUAPW, configure the Eve custom channel with:

- Route pattern: `/eve/v1/(.*)`
- Channel name: `eve`
- Channel identifier: `eve`

The Next.js Eve integration mounts the HTTP channel under `/eve/v1`; the Clerk dashboard route pattern must match that endpoint. Do not create a replacement Clerk application.

## Netlify environment variables

Configure these in the AUAPW Netlify site's environment settings for the deploy contexts that will serve the channel:

- `CLERK_SECRET_KEY` — server-only Clerk secret key.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key for the selected existing application.
- `AUAPW_PUBLIC_URL` — optional canonical origin if the deployment URL differs from the production domain.

Never commit key values or put `CLERK_SECRET_KEY` in a client-side variable. If either required key is missing, Eve channel authentication fails closed and requests are not accepted.

The configured allowed origins include the AUAPW production domain, its `www` hostname, the known Netlify site hostname, and Netlify deploy URLs supplied by `URL` / `DEPLOY_PRIME_URL`. Add any other required trusted origin explicitly after verifying ownership.

## Scope and deployment

- Existing customer Better Auth, admin login, and staff login are unchanged.
- The Eve channel accepts Clerk `session_token` authentication only.
- Vercel OIDC and anonymous production access are not enabled.
- This is a source change only. Merge and Netlify deployment require separate authorization.
- Model access and model credits are separate from channel authentication and must be verified in the chosen model provider.
