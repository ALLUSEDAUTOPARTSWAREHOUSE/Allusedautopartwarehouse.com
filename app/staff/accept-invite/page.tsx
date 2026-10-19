'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const staffId = searchParams.get('staff') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 12) {
      setError('Choose a password of at least 12 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/staff/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, staffId, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Unable to activate your account.')
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!token || !staffId) {
    return (
      <p className="text-sm text-destructive">
        This invitation link is invalid. Ask your administrator to send a new invitation.
      </p>
    )
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold text-foreground">Your account is ready</h1>
        <p className="text-sm text-muted-foreground">Your password has been set. You can now sign in to the team portal.</p>
        <Link href="/staff/login" className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go to staff login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Welcome to the team</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set your password to activate your AUAPW team portal account.</p>
      </div>
      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">New password</label>
        <Input id="password" type="password" autoComplete="new-password" minLength={12} maxLength={256}
          placeholder="At least 12 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
        <Input id="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={256}
          placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? 'Activating…' : 'Set password and activate account'}
      </Button>
    </form>
  )
}

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </main>
  )
}
