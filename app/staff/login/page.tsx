'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Boxes, Eye, EyeOff, LockKeyhole, Mail, ArrowRight } from 'lucide-react'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const response = await fetch('/api/staff/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Sign-in failed.'); return }
      router.replace(data.redirectTo); router.refresh()
    } catch { setError('Could not connect. Please try again.') } finally { setLoading(false) }
  }
  return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-950 px-4 py-12 text-white">
    <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-10">
      <Link href="/" className="mb-8 flex items-center gap-3"><span className="rounded-xl bg-orange-500 p-3 text-slate-950"><Boxes className="size-6" /></span><span><b className="block">AUAPW TEAM</b><small className="text-slate-400">Staff workspace</small></span></Link>
      <h1 className="text-3xl font-semibold">Team sign in</h1><p className="mt-2 text-sm leading-6 text-slate-400">Use the work email and password provided by your administrator.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">Work email<span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3"><Mail className="size-4 text-slate-400" /><input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="you@company.com" /></span></label>
        <label className="block text-sm font-medium">Password<span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3"><LockKeyhole className="size-4 text-slate-400" /><input required type={visible?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="Your team password" /><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'}>{visible?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></span></label>
        {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{loading?'Signing in…':'Sign in securely'} <ArrowRight className="size-4" /></button>
      </form>
      <p className="mt-6 text-xs leading-5 text-slate-500">No login yet? Ask your administrator to activate your staff account. Customer sign-in is separate.</p>
      <Link href="/admin/login" className="mt-5 inline-block text-sm text-orange-300 underline">Administrator sign in</Link>
    </section>
  </main>
}
