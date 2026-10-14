import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken, ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from '@/lib/admin-auth'
import { getAdminSessionVersion } from '@/lib/admin-passwords'
import { getAllowedGitHubAdminIds, getGitHubOAuthCredentials, getPublicAppOrigin } from '@/lib/github-admin-oauth'

export const runtime = 'nodejs'
const STATE_COOKIE = 'auapw_github_oauth_state'
const FALLBACK_ORIGIN = 'https://www.allusedautopartswarehouse.com'

function safeStateMatch(expected: string, supplied: string): boolean {
  const left = Buffer.from(expected)
  const right = Buffer.from(supplied)
  return left.length === right.length && timingSafeEqual(left, right)
}

function loginRedirect(origin: string, error: string) {
  const url = new URL('/admin/login', origin)
  url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const origin = getPublicAppOrigin()
  if (!origin) {
    return NextResponse.redirect(new URL('/admin/login?error=github_not_configured', FALLBACK_ORIGIN))
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const stateCookie = request.cookies.get(STATE_COOKIE)?.value
  const oauthError = request.nextUrl.searchParams.get('error')

  if (oauthError) return loginRedirect(origin, 'github_cancelled')
  if (!code || !state || !stateCookie || !safeStateMatch(stateCookie, state)) {
    return loginRedirect(origin, 'github_state_invalid')
  }

  const credentials = getGitHubOAuthCredentials()
  const allowedAdminIds = getAllowedGitHubAdminIds()
  if (!credentials || allowedAdminIds.size === 0) {
    return loginRedirect(origin, 'github_not_configured')
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'AUAPW-Admin-Portal',
      },
      body: JSON.stringify({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code,
        redirect_uri: `${origin}/api/portal/auth/github/callback`,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!tokenResponse.ok) return loginRedirect(origin, 'github_exchange_failed')
    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string }
    if (!tokenData.access_token || tokenData.error) return loginRedirect(origin, 'github_exchange_failed')

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenData.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AUAPW-Admin-Portal',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!userResponse.ok) return loginRedirect(origin, 'github_identity_failed')
    const user = await userResponse.json() as { login?: string; id?: number }
    const githubId = typeof user.id === 'number' && Number.isSafeInteger(user.id) ? String(user.id) : ''
    if (!githubId || !allowedAdminIds.has(githubId)) {
      return loginRedirect(origin, 'github_not_authorized')
    }

    // GitHub OAuth only grants admin access to explicitly allowlisted immutable GitHub account IDs.
    // The existing email/password route remains unchanged.
    const adminEmail = process.env.ADMIN_EMAIL || 'Info@Allusedautopartswarehouse.com'
    const token = generateAdminToken(adminEmail, await getAdminSessionVersion())
    const response = NextResponse.redirect(new URL('/admin/workspace', origin))
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: origin.startsWith('https://'),
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    })
    response.cookies.set(STATE_COOKIE, '', {
      httpOnly: true,
      secure: origin.startsWith('https://'),
      sameSite: 'lax',
      path: '/api/portal/auth/github',
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error('[github-admin-oauth] Callback failed', error instanceof Error ? error.name : 'unknown error')
    return loginRedirect(origin, 'github_signin_failed')
  }
}
