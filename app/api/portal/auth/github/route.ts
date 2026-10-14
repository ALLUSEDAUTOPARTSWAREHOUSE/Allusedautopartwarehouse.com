import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getGitHubOAuthCredentials, getPublicAppOrigin, getAllowedGitHubAdminIds } from '@/lib/github-admin-oauth'

export const runtime = 'nodejs'
const STATE_COOKIE = 'auapw_github_oauth_state'
const STATE_TTL_SECONDS = 10 * 60
const FALLBACK_ORIGIN = 'https://www.allusedautopartswarehouse.com'

export async function GET(request: NextRequest) {
  const origin = getPublicAppOrigin()
  const credentials = getGitHubOAuthCredentials()
  const admins = getAllowedGitHubAdminIds()

  if (!origin || !credentials || admins.size === 0) {
    return NextResponse.redirect(new URL('/admin/login?error=github_not_configured', origin || FALLBACK_ORIGIN))
  }

  const state = randomBytes(32).toString('base64url')
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', credentials.clientId)
  authorizeUrl.searchParams.set('redirect_uri', `${origin}/api/portal/auth/github/callback`)
  authorizeUrl.searchParams.set('scope', 'read:user')
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('allow_signup', 'false')

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: 'lax',
    path: '/api/portal/auth/github',
    maxAge: STATE_TTL_SECONDS,
  })
  return response
}
