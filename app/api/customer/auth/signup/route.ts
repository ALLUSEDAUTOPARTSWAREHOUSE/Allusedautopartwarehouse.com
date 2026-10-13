import { NextResponse } from 'next/server'

/**
 * Retired mock endpoint: never issue client-generated customer tokens.
 * Use Better Auth at /sign-in and /sign-up so private dashboard data is tied
 * to a real server-validated session.
 */
export async function POST() {
  return NextResponse.json(
    {
      message: 'This legacy endpoint is disabled. Use the secure customer sign-in or sign-up page.',
      signInUrl: '/sign-in?redirectTo=%2Fcustomer%2Fdashboard',
      signUpUrl: '/sign-up?redirectTo=%2Fcustomer%2Fdashboard',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}
