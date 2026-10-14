import "server-only"

import { createHash, randomInt, timingSafeEqual } from "crypto"
import { pool } from "@/lib/db"
import { saveAdminPassword } from "@/lib/admin-passwords"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "Info@Allusedautopartswarehouse.com").trim().toLowerCase()
const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

// Password reset codes must not be protected by Better Auth's implicit default
// secret or by the admin session secret. Configure a dedicated random secret.
function resetSecret(): string | null {
  return process.env.ADMIN_RESET_SECRET || null
}

function otpDigest(email: string, otp: string, secret: string): string {
  return createHash("sha256").update(`${email.toLowerCase()}:${otp}:${secret}`).digest("hex")
}

async function ensureResetTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.admin_password_reset_otps (
      id bigserial PRIMARY KEY,
      email text NOT NULL,
      otp_hash text NOT NULL,
      expires_at timestamptz NOT NULL,
      attempts integer NOT NULL DEFAULT 0,
      consumed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS admin_password_reset_otps_email_created_idx
      ON public.admin_password_reset_otps (email, created_at DESC);
  `)
}

export async function requestAdminPasswordOtp(emailInput: string) {
  const email = emailInput.trim().toLowerCase()
  const secret = resetSecret()
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ADMIN_RESET_FROM

  if (!secret || !apiKey || !from) {
    throw new Error("Password reset email is not configured. Set ADMIN_RESET_SECRET, RESEND_API_KEY, and ADMIN_RESET_FROM in Vercel.")
  }

  await ensureResetTable()

  // Always return the same public result for unknown addresses.
  if (email !== ADMIN_EMAIL) return

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const otpHash = otpDigest(email, otp, secret)

  await pool.query(
    "UPDATE public.admin_password_reset_otps SET consumed_at = now() WHERE email = $1 AND consumed_at IS NULL",
    [email],
  )
  await pool.query(
    "INSERT INTO public.admin_password_reset_otps (email, otp_hash, expires_at) VALUES ($1, $2, now() + ($3 || ' minutes')::interval)",
    [email, otpHash, String(OTP_TTL_MINUTES)],
  )

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your AUAPW admin password reset code",
      text: `Your AUAPW admin password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email. Do not share this code with anyone.`,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    await pool.query(
      "UPDATE public.admin_password_reset_otps SET consumed_at = now() WHERE email = $1 AND consumed_at IS NULL",
      [email],
    )
    console.error("[admin-password-reset] Email provider rejected reset email", response.status)
    throw new Error("Unable to send the reset email. Check the email provider configuration.")
  }
}

export async function verifyAdminPasswordOtpAndReset(emailInput: string, otpInput: string, newPassword: string) {
  const email = emailInput.trim().toLowerCase()
  const otp = otpInput.trim()
  const secret = resetSecret()
  if (!secret) throw new Error("Password reset is not configured.")
  if (email !== ADMIN_EMAIL || !/^\d{6}$/.test(otp)) return false

  await ensureResetTable()
  const result = await pool.query(
    `UPDATE public.admin_password_reset_otps
       SET attempts = attempts + 1
     WHERE id = (
       SELECT id FROM public.admin_password_reset_otps
       WHERE email = $1 AND consumed_at IS NULL AND expires_at > now() AND attempts < $2
       ORDER BY created_at DESC LIMIT 1
     )
     RETURNING id, otp_hash, attempts`,
    [email, MAX_ATTEMPTS],
  )
  const row = result.rows[0]
  if (!row) return false

  const expected = String(row.otp_hash)
  const actual = otpDigest(email, otp, secret)
  const expectedBuffer = Buffer.from(expected, "hex")
  const actualBuffer = Buffer.from(actual, "hex")
  const valid = expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  if (!valid) {
    if (Number(row.attempts) >= MAX_ATTEMPTS) {
      await pool.query("UPDATE public.admin_password_reset_otps SET consumed_at = now() WHERE id = $1", [row.id])
    }
    return false
  }

  const consumed = await pool.query(
    "UPDATE public.admin_password_reset_otps SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL RETURNING id",
    [row.id],
  )
  if (!consumed.rowCount) return false

  await saveAdminPassword(newPassword)
  return true
}
