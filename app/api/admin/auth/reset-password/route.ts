import { NextRequest, NextResponse } from "next/server"
import { verifyAdminPasswordOtpAndReset } from "@/lib/admin-password-reset"

export const dynamic = "force-dynamic"

function validNewPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 128 &&
    /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value)
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email : ""
    const otp = typeof body.otp === "string" ? body.otp : ""
    const newPassword = body.newPassword

    if (!validNewPassword(newPassword)) {
      return NextResponse.json({
        error: "Use 12–128 characters with at least one uppercase letter, one lowercase letter, and one number.",
      }, { status: 400 })
    }

    const success = await verifyAdminPasswordOtpAndReset(email, otp, newPassword)
    if (!success) {
      return NextResponse.json({ error: "The code is invalid, expired, or has reached its attempt limit." }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Return to admin login and sign in with your new password.",
    })
  } catch (error) {
    console.error("[admin-password-reset] Reset failed", error)
    return NextResponse.json({ error: "Password reset is temporarily unavailable." }, { status: 503 })
  }
}
