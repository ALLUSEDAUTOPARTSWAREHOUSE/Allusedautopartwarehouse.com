import { createClerkClient } from "@clerk/backend";
import type { AuthFn } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

type ClerkClient = ReturnType<typeof createClerkClient>;
let cachedClerkClient: ClerkClient | undefined;

function parseAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

// Eve is the AUAPW Operations Agent: an admin-only surface with access to
// orders, customer data, and destructive/customer-impacting actions. Clerk
// authentication only proves *who* the caller is; it does not prove they are
// an administrator. We therefore require an explicit admin authorization
// policy and fail closed (deny) when no policy is configured, mirroring the
// repo's existing allowlist-based admin model (GITHUB_ADMIN_ALLOWED_IDS).
function isAuthorizedAdmin(auth: {
  userId: string;
  orgId?: string | null;
  orgRole?: string | null;
  orgPermissions?: string[] | null;
}): boolean {
  const allowedUserIds = parseAllowlist(process.env.EVE_ADMIN_USER_IDS);
  const requiredOrgId = process.env.EVE_ADMIN_ORG_ID?.trim() || undefined;
  const requiredRole = process.env.EVE_ADMIN_ORG_ROLE?.trim() || undefined;
  const requiredPermission = process.env.EVE_ADMIN_ORG_PERMISSION?.trim() || undefined;

  // Fail closed: if no admin policy is configured, do not grant access to any
  // authenticated Clerk user. This prevents a privilege-escalation gap when
  // the Clerk application permits non-admin (e.g. customer) sign-ups.
  if (!allowedUserIds.length && !requiredOrgId && !requiredRole && !requiredPermission) {
    return false;
  }

  // Explicit user allowlist bypasses org checks.
  if (allowedUserIds.length && allowedUserIds.includes(auth.userId)) {
    return true;
  }

  // Org-based checks require the caller to be acting within the required org
  // (when one is configured) and to satisfy every configured role/permission.
  const orgChecksConfigured = Boolean(requiredOrgId || requiredRole || requiredPermission);
  if (!orgChecksConfigured) return false;

  if (requiredOrgId && auth.orgId !== requiredOrgId) return false;
  if (requiredRole && auth.orgRole !== requiredRole) return false;
  if (requiredPermission && !(auth.orgPermissions ?? []).includes(requiredPermission)) {
    return false;
  }

  return true;
}

function getClerkClient(): ClerkClient | null {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Fail closed when Netlify has not been configured. Do not fall back to
  // Vercel OIDC, anonymous access, or the local development principal.
  if (!secretKey || !publishableKey) return null;

  cachedClerkClient ??= createClerkClient({ secretKey, publishableKey });
  return cachedClerkClient;
}

const clerkAuth: AuthFn<Request> = async (request) => {
  const clerk = getClerkClient();
  if (!clerk) return null;

  const authorizedParties = [
    "https://allusedautopartswarehouse.com",
    "https://www.allusedautopartswarehouse.com",
    "https://auapwahrhouse.netlify.app",
    ...(process.env.AUAPW_PUBLIC_URL ? [process.env.AUAPW_PUBLIC_URL] : []),
    ...(process.env.URL ? [process.env.URL] : []),
    ...(process.env.DEPLOY_PRIME_URL ? [process.env.DEPLOY_PRIME_URL] : []),
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
  ];

  const state = await clerk
    .authenticateRequest(request, {
      acceptsToken: "session_token",
      authorizedParties,
    })
    .catch(() => null);

  if (!state?.isAuthenticated) return null;

  const auth = state.toAuth();
  if (!auth.userId) return null;

  // Authentication is not authorization: only admins may operate Eve.
  if (!isAuthorizedAdmin(auth)) return null;

  return {
    authenticator: "clerk",
    principalType: "user",
    principalId: auth.userId,
    subject: auth.userId,
    attributes: {
      tokenType: auth.tokenType,
      ...(auth.orgId ? { orgId: auth.orgId } : {}),
      ...(auth.orgRole ? { role: auth.orgRole } : {}),
      ...(auth.orgPermissions?.length ? { permissions: auth.orgPermissions } : {}),
    },
  };
};

export default eveChannel({
  // Eve's HTTP channel is mounted at /eve/v1 by the Next.js integration.
  // The Clerk custom-channel route must target /eve/v1/(.*).
  auth: [clerkAuth],
});
