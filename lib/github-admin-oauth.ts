import 'server-only'

/**
 * Public URL for OAuth callbacks. Configure AUAPW_PUBLIC_URL on Netlify to the
 * canonical HTTPS site origin (including the final custom domain when ready).
 * BETTER_AUTH_URL is accepted for compatibility with the existing auth setup.
 */
export function getPublicAppOrigin(): string | null {
  const configured = process.env.AUAPW_PUBLIC_URL || process.env.BETTER_AUTH_URL
  if (!configured) {
    if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
    return null
  }

  try {
    const url = new URL(configured)
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && url.hostname === 'localhost')) {
      return null
    }
    return url.origin
  } catch {
    return null
  }
}

export function getAllowedGitHubAdminIds(): Set<string> {
  return new Set(
    (process.env.GITHUB_ADMIN_ALLOWED_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)),
  )
}

export function getGitHubOAuthCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim()
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}
