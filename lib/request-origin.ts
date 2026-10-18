export function isTrustedRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const requestOrigin = new URL(request.url).origin
  const trusted = new Set(
    [
      requestOrigin,
      'https://allusedautopartswarehouse.com',
      'https://www.allusedautopartswarehouse.com',
      process.env.AUAPW_PUBLIC_URL,
      process.env.BETTER_AUTH_URL,
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
      process.env.URL,
      process.env.DEPLOY_PRIME_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/\/$/, '')),
  )

  return trusted.has(origin.replace(/\/$/, ''))
}
