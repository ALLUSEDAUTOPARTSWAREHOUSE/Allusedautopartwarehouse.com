'use client'

import { useState, type FormEvent } from 'react'

export function ChangePassword() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    if (values.get('newPassword') !== values.get('confirmPassword')) {
      setError('New passwords do not match.'); return
    }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/auth/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: values.get('currentPassword'), newPassword: values.get('newPassword') }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to change password.')
      form.reset()
      window.location.assign('/admin/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password.')
    } finally { setBusy(false) }
  }
  return (
    <section className="rounded-lg border bg-card p-5" aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-lg font-semibold">Change admin password</h2>
      <p className="mb-4 text-sm text-muted-foreground">Change your password whenever needed. Use at least 12 characters. All admin sessions will be signed out after a change; sign in with your new password. Changes are stored securely in the database and do not require redeploying.</p>
      <form onSubmit={submit} className="max-w-md space-y-3">
        {[
          ['currentPassword', 'Current password', 'current-password'],
          ['newPassword', 'New password', 'new-password'],
          ['confirmPassword', 'Confirm new password', 'new-password'],
        ].map(([name, label, autoComplete]) => <label key={name} className="block text-sm">{label}<input name={name} type="password" autoComplete={autoComplete} required minLength={name === 'currentPassword' ? 1 : 12} maxLength={256} disabled={busy} className="mt-1 block w-full rounded-md border bg-background p-2" /></label>)}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Saving…' : 'Change password & sign out'}</button>
      </form>
    </section>
  )
}
