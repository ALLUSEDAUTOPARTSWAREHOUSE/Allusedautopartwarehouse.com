'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, Upload, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react'

export function CatalogCommandCenter() {
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  async function hide(event: FormEvent) {
    event.preventDefault()
    if (busy || confirmation !== 'HIDE ALL PRODUCTS') return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/catalog-hide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }) })
      const result = await response.json()
      setMessage(response.ok ? `${Number(result.affected).toLocaleString()} records affected. ${result.message}` : result.error)
      if (response.ok) { setConfirmation(''); router.refresh() }
    } catch { setMessage('Result unknown. Refresh product visibility before retrying.') }
    finally { setBusy(false) }
  }
  return <section className="space-y-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-muted/40 p-6 sm:p-8" aria-labelledby="catalog-command-heading">
    <header><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">AUAPW Digital Operations</p><h2 id="catalog-command-heading" className="mt-2 text-3xl font-bold">Your catalog command center</h2><p className="mt-3 max-w-3xl text-sm text-muted-foreground">Manage replacement inventory, review brand counts and resolve upload issues from one workspace. Product records are not physical stock quantities or confirmed Google listings.</p></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Brands & product editor', detail: 'Prices, images and visibility', href: '/admin/products', icon: Boxes },
        { label: 'Upload replacements', detail: 'Preview small imports; stage large files', href: '/admin/products#catalog-upload', icon: Upload },
        { label: 'Catalog health', detail: 'Missing prices and image review', href: '/admin/merchant', icon: Activity },
        { label: 'Configuration checks', detail: 'Database and integration readiness', href: '/admin/settings', icon: ShieldCheck },
      ].map(({ label, detail, href, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg motion-reduce:transition-none"><Icon className="size-6 text-primary" /><h3 className="mt-4 font-semibold">{label} <ArrowUpRight className="inline size-4" /></h3><p className="mt-2 text-xs text-muted-foreground">{detail}</p></Link>)}
    </div>
    <details className="rounded-2xl border border-destructive/30 bg-card p-5">
      <summary className="cursor-pointer font-semibold text-destructive">Hide all uploaded/manual products across all brands</summary>
      <p className="mt-3 text-sm">This hides every current uploaded/manual record and excludes it from the local feed, preserving records and existing override prices. Old bundled catalogs are already excluded by replacement mode. It does not delete Google/social account products. Re-imports may remain hidden until explicitly unhidden in the product editor.</p>
      <form onSubmit={hide} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm">Type HIDE ALL PRODUCTS<input value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" className="rounded-lg border bg-background px-3 py-2" /></label>
        <button disabled={busy || confirmation !== 'HIDE ALL PRODUCTS'} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-40">{busy ? 'Hiding…' : 'Confirm hide all'}</button>
      </form>
      <p role="status" className="mt-3 text-sm">{message}</p>
    </details>
    <p className="text-xs text-muted-foreground">500 MB uploads stage files only. Automatic validation workers, row-level error reports and full brand replacement are separate features, not enabled by this dashboard.</p>
  </section>
}
