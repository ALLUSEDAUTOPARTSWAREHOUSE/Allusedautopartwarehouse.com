import { consumeCustomerInvite } from '@/lib/customer-invites'
import { APIError } from 'better-auth/api'
import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

function inviteTokenFromRequest(headers?: Headers | null) {
  const fromHeader = headers?.get('x-auapw-invite')
  if (fromHeader) return fromHeader
  const cookie = headers?.get('cookie') ?? ''
  const match = cookie.match(/(?:^|; )auapw_invite=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export const auth = betterAuth({
  database: pool,
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (!await consumeCustomerInvite(user.email, inviteTokenFromRequest(context?.headers))) {
            throw new APIError('FORBIDDEN', { message: 'An unused, unexpired invitation for this email is required.' })
          }
          return { data: user }
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.ADMIN_SESSION_SECRET,
  baseURL:
    process.env.AUAPW_PUBLIC_URL ??
    process.env.BETTER_AUTH_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined) ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            prompt: 'select_account',
          },
        }
      : {}),
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
    ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
    ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
    ...(process.env.AUAPW_PUBLIC_URL ? [process.env.AUAPW_PUBLIC_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.URL ? [process.env.URL] : []),
    ...(process.env.DEPLOY_PRIME_URL ? [process.env.DEPLOY_PRIME_URL] : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
