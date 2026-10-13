'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react'

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
    <div className="relative isolate flex min-h-[calc(100svh-7rem)] items-center justify-center overflow-hidden bg-[#080d18] px-3 py-8 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1321]/90 shadow-2xl shadow-black/40 lg:min-h-[650px] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#172338] via-[#101a2a] to-[#0b111e] p-10 text-white lg:flex xl:p-14">
          <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div aria-hidden="true" className="absolute -right-24 top-24 h-80 w-80 rounded-full border border-orange-400/20 shadow-[0_0_100px_rgba(249,115,22,.12)]" />
          <div aria-hidden="true" className="absolute -right-10 top-40 h-52 w-52 rounded-full border border-orange-400/20" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20"><ShieldCheck className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold tracking-[.18em]">AUAPW</p><p className="mt-0.5 text-xs text-slate-400">Operations workspace</p></div>
          </div>
          <div className="relative max-w-lg py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-xs font-medium text-orange-200"><Sparkles className="h-3.5 w-3.5" /> Admin control center</div>
            <h2 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">Every part of your business, <span className="text-orange-400">in one place.</span></h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">Manage inventory, quote requests, customer leads and your team from a workspace built for your auto-parts operation.</p>
            <div className="mt-9 space-y-4 text-sm text-slate-200">
              {['Inventory and product management', 'Quotes, leads and customer requests', 'Team access with secure admin sessions'].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-orange-400" />{item}</div>)}
            </div>
          </div>
          <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-500"><span>ALL USED AUTO PARTS WAREHOUSE</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Secure access</span></div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-slate-950"><ShieldCheck className="h-5 w-5" /></div>
              <div><p className="font-bold tracking-wide text-white">AUAPW ADMIN</p><p className="text-xs text-slate-400">Operations workspace</p></div>
            </div>
            <p className="text-sm font-medium text-orange-400">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sign in to admin</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Enter your administrator credentials to continue to your dashboard.</p>

            {error && <div role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="admin-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourcompany.com" required className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10" />
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
                {isLoading ? 'Signing you in…' : 'Sign in securely'} {!isLoading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs leading-5 text-slate-400">Protected administrator access. Your session is secured by the server; never share your password or verification codes.</p>
            </div>
            <p className="mt-7 text-center text-xs text-slate-500">Need access? Contact your system administrator.</p>
            <div className="mt-5 text-center"><Link href="/account/login" className="text-xs text-slate-400 underline decoration-white/20 underline-offset-4 transition hover:text-white">Looking for the customer account portal?</Link></div>
          </div>
        </section>
      </div>
    </div>
  )
}
