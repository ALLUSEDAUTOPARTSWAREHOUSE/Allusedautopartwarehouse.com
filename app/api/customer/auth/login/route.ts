import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is retired. Use /api/auth/sign-in/email.' },
    { status: 410 },
  )
}
