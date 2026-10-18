import { getAdminSession } from '@/lib/admin-auth'
import { createCustomerInvite, revokeCustomerInvite } from '@/lib/customer-invites'
import { z } from 'zod'

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  const body = z.object({ email: z.string().trim().email().max(200) }).safeParse(await request.json().catch(() => null))
  if (!body.success) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ADMIN_RESET_FROM
  const configuredUrl = process.env.AUAPW_PUBLIC_URL || process.env.BETTER_AUTH_URL
  if (!apiKey || !from || !configuredUrl) return Response.json({ error: 'Invitation email is not configured.' }, { status: 503 })
  let token: string | undefined
  try {
    const base = new URL(configuredUrl)
    if (base.protocol !== 'https:' || base.username || base.password) throw new Error('Invalid public origin')
    token = await createCustomerInvite(body.data.email)
    const link = new URL('/sign-up', base.origin)
    link.searchParams.set('invite', token)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [body.data.email], subject: 'Your AUAPW account invitation',
        text: `You are invited to create an AUAPW customer account. Open this link and use the email address that received this invitation:\n\n${link}\n\nThe link expires in 72 hours and can be used once. If unexpected, ignore this email.` }),
    })
    if (!response.ok) throw new Error('Provider rejected invitation')
    return Response.json({ message: 'Invitation accepted by the email provider. Delivery is not yet confirmed.' })
  } catch {
    if (token) await revokeCustomerInvite(token).catch(() => undefined)
    return Response.json({ error: 'Invitation could not be sent. Check email configuration and try again.' }, { status: 503 })
  }
}
