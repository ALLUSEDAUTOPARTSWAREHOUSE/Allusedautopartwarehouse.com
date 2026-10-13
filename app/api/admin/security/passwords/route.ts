import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import {
  listStaffPasswordStates, saveAdminPassword, setStaffPassword, verifyCurrentAdminPassword,
} from "@/lib/admin-passwords"

export const dynamic = "force-dynamic"

function validNewPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 128 &&
    /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value)
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    return NextResponse.json({ staff: await listStaffPasswordStates() })
  } catch (error) {
    console.error("[admin-security] Unable to list staff credential states", error)
    return NextResponse.json({ error: "Could not load team password settings. Check database setup." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = body.newPassword
    const action = body.action

    if (!(await verifyCurrentAdminPassword(currentPassword))) {
      return NextResponse.json({ error: "Current admin password is incorrect." }, { status: 403 })
    }
    if (!validNewPassword(newPassword)) {
      return NextResponse.json({ error: "Use 12–128 characters with at least one uppercase letter, one lowercase letter, and one number." }, { status: 400 })
    }

    if (action === "change-admin") {
      if (currentPassword === newPassword) {
        return NextResponse.json({ error: "Choose a new password different from the current password." }, { status: 400 })
      }
      await saveAdminPassword(newPassword)
      const response = NextResponse.json({ success: true, message: "Admin password changed. Sign in again with the new password." })
      response.cookies.set("auapw_admin_session", "", {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: 0,
      })
      return response
    }

    if (action === "set-staff" && typeof body.staffId === "string" && body.staffId.length > 0) {
      await setStaffPassword(body.staffId, newPassword)
      return NextResponse.json({ success: true, message: "Team member password saved as a secure hash." })
    }

    return NextResponse.json({ error: "Invalid password management action." }, { status: 400 })
  } catch (error) {
    console.error("[admin-security] Password update failed", error)
    return NextResponse.json({ error: "Password update failed. Confirm the staff member exists and try again." }, { status: 500 })
  }
}
