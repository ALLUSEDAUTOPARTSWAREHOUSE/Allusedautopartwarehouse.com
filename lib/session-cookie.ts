type CookieOptions = {
  httpOnly: true
  path: '/'
  maxAge: number
  secure: boolean
  sameSite: 'none' | 'lax'
}

export function authCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    maxAge,
    secure: true,
    sameSite: 'none',
  }
}
