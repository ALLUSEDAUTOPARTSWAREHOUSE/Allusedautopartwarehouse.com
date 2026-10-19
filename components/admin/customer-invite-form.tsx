'use client'
import { useState, type FormEvent } from 'react'

export function CustomerInviteForm() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') || '')
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/customer-invites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      })
      const result = await response.json()
      setMessage(response.ok ? result.message : result.error || 'Invitation failed.')
    } catch { setMessage('Unable to send invitation. Try again.') }
    finally { setBusy(false) }
  }
  return <section className="space-y-3 rounded-xl border p-4">
    <h2 className="font-semibold">Invite a customer</h2>
    <p className="text-sm text-muted-foreground">New accounts require an email invitation. This creates customer access only, never an admin or staff role. Existing accounts keep their current login.</p>
    <form onSubmit={submit} className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-sm">Customer email<input name="email" type="email" required maxLength={200} className="rounded border bg-background p-2" /></label>
      <button disabled={busy} className="self-end rounded border px-4 py-2 disabled:opacity-50">{busy ? 'Sending…' : 'Send invitation'}</button>
    </form>
    <p role="status" className="text-sm">{message}</p>
    <p className="text-sm"><a href="/admin/team" className="underline">Manage staff invitations separately</a>. Admin access is not granted through customer invitations.</p>
  </section>
}
