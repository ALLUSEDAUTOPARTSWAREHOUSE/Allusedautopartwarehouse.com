'use client'

import { Eye, EyeOff, ArrowRight, ShieldCheck, PackageSearch, Wrench } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode, redirectTo = '/' }: { mode: 'sign-in' | 'sign-up'; redirectTo?: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'
  const target = redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.includes(String.fromCharCode(92)) && !redirectTo.split(/[?#]/, 1)[0].split('/').some((part) => part === '.' || part === '..') ? redirectTo : '/'
  const switchHref = `${isSignUp ? '/sign-in' : '/sign-up'}?redirectTo=${encodeURIComponent(target)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Unable to authenticate. Please try again.')
        return
      }
      router.push(target)
      router.refresh()
    } catch {
      setError('Unable to reach the sign-in service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[#f4f4f2] px-4 py-6 text-[#191919] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 py-2">
          <Link href="/" className="flex items-center gap-3" aria-label="All Used Auto Parts Warehouse home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#f36b21] text-white"><Wrench className="size-5" /></span>
            <span className="text-xs font-black leading-tight tracking-[0.12em] sm:text-sm">ALL USED AUTO PARTS<br />WAREHOUSE</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-neutral-600 transition hover:text-[#f36b21]">Back to store <ArrowRight className="ml-1 inline size-4" /></Link>
        </header>

        <section className="my-auto grid overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_30px_100px_-45px_rgba(0,0,0,0.3)] lg:min-h-[650px] lg:grid-cols-[1.02fr_0.98fr]">
          <div className={`relative isolate flex min-h-[260px] flex-col justify-between overflow-hidden bg-[#17191b] p-7 text-white transition-all duration-700 motion-reduce:transition-none sm:p-10 lg:p-14 ${isSignUp ? 'lg:order-2' : ''}`}>
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true">
              <div className="absolute -right-20 -top-24 size-80 rounded-full border border-white/20" />
              <div className="absolute -right-8 top-0 size-64 rounded-full border border-white/10" />
              <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-[#f36b21]/25 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_35%,rgba(243,107,33,0.2)_100%)]" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200"><span className="size-1.5 rounded-full bg-[#f36b21]" /> Built for the road ahead</span>
              <h2 className="mt-7 max-w-lg text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">{isSignUp ? 'Find the right part. Get back out there.' : 'Good to have you back.'}</h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-neutral-300 sm:text-base">{isSignUp ? 'Create your customer account to make your next parts search simpler.' : 'Sign in to continue your parts search and manage your customer account.'}</p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"><PackageSearch className="size-5 text-[#f36b21]" /><p className="mt-3 text-sm font-semibold">Parts made easier</p><p className="mt-1 text-xs leading-5 text-neutral-400">Keep your customer journey in one place.</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"><ShieldCheck className="size-5 text-[#f36b21]" /><p className="mt-3 text-sm font-semibold">Secure account access</p><p className="mt-1 text-xs leading-5 text-neutral-400">Your customer account stays separate from admin access.</p></div>
            </div>
            <p className="mt-8 text-[11px] tracking-wide text-neutral-500">ALL USED AUTO PARTS WAREHOUSE</p>
          </div>

          <div className={`flex items-center justify-center p-6 transition-all duration-700 motion-reduce:transition-none sm:p-10 lg:p-14 ${isSignUp ? 'lg:order-1' : ''}`}>
            <div key={mode} className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-500 motion-reduce:animate-none">
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f36b21]">{isSignUp ? 'Join our community' : 'Customer portal'}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
                <p className="mt-3 text-sm leading-6 text-neutral-500">{isSignUp ? 'A few details and you’re ready to go.' : 'Enter your details to access your account.'}</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {isSignUp && <div className="flex flex-col gap-2"><Label htmlFor="name" className="text-sm font-medium">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Your full name" className="h-12 rounded-xl border-neutral-200 bg-neutral-50 px-4 focus-visible:ring-[#f36b21]" /></div>}
                <div className="flex flex-col gap-2"><Label htmlFor="email" className="text-sm font-medium">Email address</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="h-12 rounded-xl border-neutral-200 bg-neutral-50 px-4 focus-visible:ring-[#f36b21]" /></div>
                <div className="flex flex-col gap-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="password" className="text-sm font-medium">Password</Label></div><div className="relative"><Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'} className="h-12 rounded-xl border-neutral-200 bg-neutral-50 px-4 pr-12 focus-visible:ring-[#f36b21]" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f36b21]">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>

                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
                <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#f36b21] font-semibold text-white shadow-sm transition hover:bg-[#d95c19] disabled:opacity-60">{loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'} <ArrowRight className="ml-2 size-4" /></Button>
              </form>

              <p className="mt-7 text-center text-sm text-neutral-500">{isSignUp ? 'Already have an account?' : "Don’t have an account?"}{' '}<Link href={switchHref} className="font-semibold text-[#d95c19] underline-offset-4 hover:underline">{isSignUp ? 'Sign in' : 'Create account'}</Link></p>
              <p className="mt-8 text-center text-[11px] leading-5 text-neutral-400">By continuing, you agree to use your account responsibly. Customer access does not grant administrator permissions.</p>
            </div>
          </div>
        </section>
        <footer className="py-5 text-center text-xs text-neutral-500">© {new Date().getFullYear()} All Used Auto Parts Warehouse</footer>
      </div>
    </main>
  )
}
