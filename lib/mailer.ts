import "server-only"

import type { ReactElement } from "react"
import { render } from "react-email"
import { Resend } from "resend"

export type MailResult = {
  ok: boolean
  error?: string
}

export function emailFromAddress() {
  return (
    process.env.EMAIL_FROM ||
    (process.env.RESEND_EMAIL_DOMAIN
      ? `AUAPW Website <notifications@${process.env.RESEND_EMAIL_DOMAIN}>`
      : "AUAPW Website <onboarding@resend.dev>")
  )
}

export async function sendReactEmail(options: {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
  from?: string
  idempotencyKey?: string
  tags?: { name: string; value: string }[]
}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[mailer] RESEND_API_KEY missing; email not sent")
    return { ok: false, error: "RESEND_API_KEY is not set in Vercel" }
  }

  const to = Array.isArray(options.to) ? options.to : [options.to]
  try {
    const html = await render(options.react)
    const text = await render(options.react, { plainText: true })
    const { error } = await new Resend(apiKey).emails.send(
      {
        from: options.from || emailFromAddress(),
        to,
        subject: options.subject,
        html,
        text,
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
        ...(options.tags ? { tags: options.tags } : {}),
      },
      options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
    )
    if (error) {
      console.error("[mailer] Resend error:", error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[mailer] Email send failed:", message)
    return { ok: false, error: message }
  }
}
