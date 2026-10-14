'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Mail, LockKeyhole, UserRound, PackageCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function AccountLoginPage() {
  const router = useRouter()
  const { login, signup, user, isLoading } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user && !isLoading) router.replace('/')
  }, [user, isLoading, router])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signup') {
        if (password.length < 8) {
          setError('Choose a password with at least 8 characters.')
          return
        }
        await signup(email.trim(), password, name.trim())
        setMessage('Your account is ready. You are now signed in.')
      } else {
        await login(email.trim(), password)
      }
      router.refresh()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not complete your request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden bg-[#080d18] px-3 py-8 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1321]/95 shadow-2xl shadow-black/40 lg:min-h-[650px] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#173044] via-[#101e30] to-[#0b111e] p-10 text-white lg:flex xl:p-14">
          <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div aria-hidden="true" className="absolute -right-20 top-24 h-80 w-80 rounded-full border border-cyan-300/20 shadow-[0_0_100px_rgba(34,211,238,.12)]" />
          <div aria-hidden="true" className="absolute -right-5 top-40 h-52 w-52 rounded-full border border-cyan-300/20" />
          <Link href="/" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20"><PackageCheck className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold tracking-[.14em]">AUAPW</p><p className="mt-0.5 text-xs text-slate-400">Auto parts, made simpler</p></div>
          </Link>
          <div className="relative max-w-lg py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100"><CheckCircle2 className="h-3.5 w-3.5" /> Your parts journey starts here</div>
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">Find the right part. <span className="text-cyan-300">Keep moving.</span></h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">Create an account to make it easier to request quotes and stay connected with the AUAPW team.</p>
            <div className="mt-9 space-y-4 text-sm text-slate-200">
              {['Request quotes for the parts you need', 'Keep your account details in one place', 'Get a smoother experience on your next visit'].map(item => <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" />{item}</div>)}
            </div>
          </div>
          <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-500"><span>ALL USED AUTO PARTS WAREHOUSE</span><span>Customer account</span></div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-slate-950"><PackageCheck className="h-5 w-5" /></div>
              <div><p className="font-bold tracking-wide text-white">AUAPW ACCOUNT</p><p className="text-xs text-slate-400">Customer portal</p></div>
            </div>
            <div className="inline-flex rounded-xl border border-white/10 bg-white/[.04] p-1">
              <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage('') }} className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${mode === 'signin' ? 'bg-cyan-300 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}>Sign in</button>
              <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage('') }} className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${mode === 'signup' ? 'bg-cyan-300 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}>Create account</button>
            </div>
            <p className="mt-7 text-sm font-medium text-cyan-300">{mode === 'signin' ? 'Welcome back' : 'Get started with AUAPW'}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{mode === 'signin' ? 'Your account' : 'Create your account'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{mode === 'signin' ? 'Sign in to continue to AUAPW.' : 'Use your email to create a customer account.'}</p>

            {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {message && <div role="status" className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === 'signup' && <div><label htmlFor="customer-name" className="mb-2 block text-sm font-medium text-slate-200">Full name</label><div className="relative"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="customer-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10" /></div></div>}
              <div><label htmlFor="customer-email" className="mb-2 block text-sm font-medium text-slate-200">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="customer-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10" /></div></div>
              <div><label htmlFor="customer-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="customer-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} required className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10" /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{mode === 'signup' && <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters.</p>}</div>
              <button type="submit" disabled={busy || isLoading} className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/15 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} {!busy && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}</button>
            </form>
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><p className="text-xs leading-5 text-slate-400">Your account is handled by the site's authentication service. We never show your password in the browser.</p></div>
            <p className="mt-6 text-center text-xs text-slate-500">Need administrator access? <Link href="/admin/login" className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200">Admin sign in</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}
