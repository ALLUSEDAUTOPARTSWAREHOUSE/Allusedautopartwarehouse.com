# Invite-only account registration

## Customer accounts

Sign in as the existing administrator, open **Customers**, enter the customer's email and choose **Send invitation**. This explicit action sends an email; deployment itself sends nothing. The recipient opens `/sign-up?invite=…`, enters the same email and chooses their password. Creation is permitted only once within 72 hours. Existing customers retain their normal sign-in. Invitations do not reset existing account passwords.

Public registration without a matching invitation is blocked in Better Auth's user-creation database hook, including direct API and alternative new-user creation paths. The browser page also explains that an invitation is required. The link is a bearer credential: do not paste it into chats or logs. Tokens are random and only SHA-256 hashes are stored. Merely opening the link does not consume it. A failed account creation after the invitation is consumed requires an administrator to issue a new invitation.

## Staff and administrator access

Continue adding approved sales/support/developer staff in the Team directory and sending their existing staff invitations. Staff select a password through the existing acceptance page; customer invitations never grant staff or admin roles. Invalid staff tokens no longer consume valid invitations.

The owner administrator account remains managed by the existing admin authentication and reset flow. This change does **not** introduce multiple administrator accounts, invite the owner automatically, or replace owner password reset with a magic sign-in link. Existing admin access is preserved; there is no public administrator registration.

## Configuration and deployment

Customer email requires `RESEND_API_KEY`, a valid verified sender in `ADMIN_RESET_FROM`, and a canonical HTTPS storefront origin in `AUAPW_PUBLIC_URL` (or `BETTER_AUTH_URL`). Set the origin to the storefront hosting `/sign-up`, not an admin-only subdomain. Staff emails use the same configured sender when present and canonical origin. Do not put secrets in chat.

The application database role needs permission to create the additive `customer_invites` table; it is initialized on first invitation. No existing customer or order tables are changed. Table creation/query failure blocks new registration rather than silently enabling public access. Already-issued customer links remain valid until expiry unless consumed or revoked; resend does not implicitly invalidate previous customer links.

Provider acceptance is not delivery. Verify Resend delivery events and the recipient inbox, then test accepted, expired, wrong-email and replayed links on a preview before promotion. Keep existing customer, staff and owner sign-ins in the release checklist. There is no end-to-end delivery guarantee from a successful build.
