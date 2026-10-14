'use client'
import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
type Member = { id: string; name: string; email: string; role: string; status: string | null }
export function TeamAccessClient({ members }: { members: Member[] }) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(''); setMessage('')
    if (!id) { setError('Select a team member first.'); return }
    if (password.length < 12) { setError('Password must be at least 12 characters.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/staff/' + encodeURIComponent(id) + '/credentials', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not update login.'); return }
      setMessage(data.message || 'Login access updated.'); setPassword('')
    } catch { setError('Network error. Please try again.') } finally { setBusy(false) }
  }
  const selected = members.find(m => m.id === id)
  return <main className="mx-auto max-w-4xl px-5 py-10">
    <Link href="/admin/team" className="text-sm text-primary underline">← Back to Team Directory</Link>
    <h1 className="mt-4 text-3xl font-bold">Team login access</h1>
    <p className="mt-2 text-muted-foreground">Create or reset a staff member's separate login. This does not change customer accounts or the administrator password.</p>
    <section className="mt-7 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-3 text-primary"><ShieldCheck className="size-5"/></span><div><h2 className="font-semibold">Provision staff credentials</h2><p className="text-sm text-muted-foreground">Passwords are stored as salted scrypt hashes, never as plain text.</p></div></div>
      <form onSubmit={save} className="mt-6 space-y-5">
        <label className="block text-sm font-medium">Team member<select value={id} onChange={e=>setId(e.target.value)} required className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-3"><option value="">Choose a team member…</option>{members.map(m=><option key={m.id} value={m.id} disabled={m.status!=='active'}>{m.name} — {m.email} ({m.role}){m.status!=='active'?' · inactive':''}</option>)}</select></label>
        {selected && <p className="rounded-lg bg-muted p-3 text-sm"><Users className="mr-2 inline size-4"/>{selected.name} · {selected.role}</p>}
        <label className="block text-sm font-medium">Temporary or new password<Input className="mt-2" type="password" autoComplete="new-password" minLength={12} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 12 characters" required /></label>
        <p className="text-xs text-muted-foreground">Setting a new password immediately revokes that member's existing sessions. Share the password securely and ask them to change it through your approved process.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
        <Button type="submit" disabled={busy || !id || password.length < 12} className="gap-2"><KeyRound className="size-4"/>{busy?'Saving…':'Enable login / reset password'}</Button>
      </form>
    </section>
    <section className="mt-6 rounded-2xl border border-border p-5"><h2 className="font-semibold">Staff sign-in URL</h2><p className="mt-2 text-sm text-muted-foreground">Team members use <code>/staff/login</code>. Their destination and access are determined by their assigned role.</p></section>
  </main>
}
