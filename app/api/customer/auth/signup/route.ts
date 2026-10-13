import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is retired. Use /api/auth/sign-up/email.' },
    { status: 410 },
  )
}
