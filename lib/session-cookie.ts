type CookieOptions = {
  httpOnly: true
  path: '/'
  maxAge: number
  secure: boolean
  sameSite: 'none' | 'lax'
}

export function authCookieOptions(maxAge: number): CookieOptions {
  const preview = process.env.NODE_ENV !== 'production'
  return {
    httpOnly: true,
    path: '/',
    maxAge,
    secure: preview || process.env.NODE_ENV === 'production',
    sameSite: preview ? 'none' : 'lax',
  }
}
