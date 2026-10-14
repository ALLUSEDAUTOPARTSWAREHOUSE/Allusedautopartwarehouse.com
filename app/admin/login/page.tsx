'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, Mail, Eye, EyeOff, ShieldCheck, Boxes, Users, Headset, Code2, ShoppingBag } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
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
      router.replace(data.redirectTo || '/admin/workspace')
      router.refresh()
    } catch {
      setError('We could not connect securely. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center px-3 py-8 sm:px-6">
      <section className="grid w-full overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-2xl lg:min-h-[620px] lg:grid-cols-2">
        <div className="relative flex flex-col justify-between overflow-hidden p-7 sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,.25),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,.16),transparent_50%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-slate-950"><Boxes className="size-6" /></span><span><b className="block text-sm">AUAPW</b><span className="text-xs text-slate-400">ALL USED AUTO PARTS WAREHOUSE</span></span></Link>
            <div className="mt-14 max-w-lg">
              <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold text-orange-200">ONE SECURE PORTAL</span>
              <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Your whole operation. <span className="text-orange-400">One sign-in.</span></h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Inventory, quotes, orders, customers, support, and development tools — routed to the right workspace for your role.</p>
          </div>
          </div>
          <div className="relative mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[{ icon: ShoppingBag, label: 'Orders' }, { icon: Users, label: 'Sales agents' }, { icon: Headset, label: 'Support' }, { icon: Code2, label: 'Developers' }].map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><Icon className="size-4 text-orange-300" /><p className="mt-3 text-xs font-medium text-slate-200">{label}</p></div>)}
          </div>
          <p className="relative mt-8 text-xs text-slate-500">Authorized access only · Secure session</p>
        </div>
        <div className="relative flex items-center justify-center overflow-hidden bg-slate-50 p-5 text-slate-900 sm:p-9 lg:p-12">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-orange-100 blur-3xl" />
          <div className="relative w-full max-w-md">
            <div className="mb-7 flex size-12 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600"><ShieldCheck className="size-6" /></div>
            <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your authorized work account. We’ll open the workspace assigned to your role.</p>
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <form onSubmit={handleLogin} className="mt-7 space-y-5">
              <div><label htmlFor="portal-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="portal-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourcompany.com" required className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/15" /></div></div>
              <div><div className="mb-2 flex items-center justify-between"><label htmlFor="portal-password" className="text-sm font-semibold text-slate-700">Password</label><Link href="/admin/forgot-password" className="text-xs font-semibold text-orange-700 hover:underline">Forgot password?</Link></div><div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="portal-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/15" /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-800">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
              <button type="submit" disabled={isLoading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:opacity-60">{isLoading ? 'Signing you in…' : 'Sign in to AUAPW'} {!isLoading && <ArrowRight className="size-4 transition group-hover:translate-x-1" />}</button>
            </form>
            <p className="mt-6 text-xs leading-5 text-slate-500">Administrator access only. Staff and customer accounts sign in separately.</p>
            <Link href="/sign-in" className="mt-3 inline-block text-sm font-semibold text-orange-700 hover:underline">Customer sign in</Link>
            <Link href="/staff/login" className="mt-3 inline-block text-sm font-semibold text-orange-700 hover:underline">Staff sign in</Link>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck className="size-3.5" /> Protected sign-in · Role-based access</div>
            <Link href="/" className="mt-4 block text-center text-xs font-medium text-slate-500 hover:text-slate-900">Back to website</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
