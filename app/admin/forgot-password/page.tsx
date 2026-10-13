'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotAdminPasswordPage() {
  const [email, setEmail] = useState('Info@Allusedautopartswarehouse.com')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function sendCode() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send reset code.')
      setCodeSent(true)
      setMessage(data.message || 'Check your email for the reset code.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send reset code.')
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      setBusy(false)
      return
    }
    try {
      const response = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to reset password.')
      setMessage(data.message || 'Password reset successfully.')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setCodeSent(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reset password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-xl border border-border bg-card p-6 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-muted-foreground">AUAPW Admin</p>
        <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Request a 6-digit code by email. The code expires after 10 minutes.
        </p>

        {message && <div role="status" className="mt-4 rounded-md border border-border bg-muted p-3 text-sm">{message}</div>}
        {error && <div role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <label htmlFor="reset-email" className="mt-5 block text-sm font-medium text-foreground">Administrator email</label>
        <input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground" />

        {!codeSent ? (
          <button type="button" disabled={busy} onClick={sendCode}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? 'Sending code…' : 'Send OTP to email'}
          </button>
        ) : (
          <form onSubmit={resetPassword} className="mt-4 space-y-4">
            <div>
              <label htmlFor="reset-otp" className="block text-sm font-medium text-foreground">6-digit email code</label>
              <input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 tracking-[0.3em] text-foreground" />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128}
                value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">12–128 characters, including uppercase, lowercase, and a number.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground" />
            </div>
            <button type="submit" disabled={busy || otp.length !== 6}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">
              {busy ? 'Resetting password…' : 'Verify code & reset password'}
            </button>
            <button type="button" disabled={busy} onClick={sendCode}
              className="w-full rounded-lg border border-border px-4 py-2.5 font-medium text-foreground disabled:opacity-50">
              Send a new code
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm"><Link href="/admin/login" className="font-medium text-primary underline">Back to admin login</Link></p>
      </section>
    </div>
  )
}
