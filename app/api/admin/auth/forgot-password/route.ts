import { NextRequest, NextResponse } from "next/server"
import { requestAdminPasswordOtp } from "@/lib/admin-password-reset"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
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
