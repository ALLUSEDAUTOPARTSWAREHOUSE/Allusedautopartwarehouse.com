import { createClerkClient } from "@clerk/backend";
import type { AuthFn } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

type ClerkClient = ReturnType<typeof createClerkClient>;
let cachedClerkClient: ClerkClient | undefined;

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
