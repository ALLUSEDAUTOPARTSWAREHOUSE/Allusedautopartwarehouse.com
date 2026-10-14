import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.AUAPW_PUBLIC_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.AUAPW_PUBLIC_URL ? [process.env.AUAPW_PUBLIC_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
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
