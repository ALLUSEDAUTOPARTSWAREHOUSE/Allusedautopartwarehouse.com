'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/staff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Unable to sign in. Check your credentials and try again.')
        return
      }
      router.replace(result.redirectTo)
      router.refresh()
    } catch {
      setError('We could not connect securely. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12">
      <h1 className="text-3xl font-bold">Staff sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use your provisioned work email and password.</p>
      {error && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={signIn} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Work email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
        <label className="block text-sm font-medium">Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
        <button type="submit" disabled={loading} className="h-11 w-full rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <Link href="/admin/login" className="mt-6 text-center text-sm font-medium text-primary hover:underline">Administrator sign in</Link>
    </main>
  )
}
