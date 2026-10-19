import { NextRequest, NextResponse } from "next/server"
import { requestAdminPasswordOtp } from "@/lib/admin-password-reset"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const trustedOrigins = new Set(
    [
      request.nextUrl.origin,
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    ].filter((value): value is string => Boolean(value)),
  )
  if (origin && !trustedOrigins.has(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email : ""
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    await requestAdminPasswordOtp(email)
    return NextResponse.json({
      success: true,
      message: "If this is the administrator email, a 6-digit reset code has been sent. Check your inbox and spam folder.",
    })
  } catch (error) {
    console.error("[admin-password-reset] OTP request failed", error)
    return NextResponse.json({
      error: "Password reset email is temporarily unavailable. Please contact the system administrator.",
    }, { status: 503 })
  }
}
