'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight,  LockKeyhole, Mail,   Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Unable to sign in. Check your credentials and try again.')
        return
      }
      router.refresh()
      router.push('/admin/dashboard')
    } catch {
      setError('We could not connect securely. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-8">
      <section className="w-full rounded-2xl border bg-slate-950 p-6 text-white">
        <h1 className="text-2xl font-semibold">AUAPW Admin</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to your dashboard.</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="admin-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@allusedautopartswarehouse.com" required className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><label htmlFor="admin-password" className="block text-sm font-medium text-slate-200">Password</label><Link href="/admin/forgot-password" className="text-xs font-medium text-orange-400 transition hover:text-orange-300">Forgot password?</Link></div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/15 transition hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? 'Signing you in…' : 'Sign in'} {!isLoading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
              </button>
            </form>
        <Link href="/" className="mt-6 block text-center text-sm text-slate-400 underline">Back to website</Link>
      </section>
    </div>
  )
}
