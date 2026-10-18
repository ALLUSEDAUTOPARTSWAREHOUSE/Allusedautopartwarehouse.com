'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BrandFeedStats } from '@/lib/merchant'
import { filterCatalogBrands, summarizeCatalog } from '@/lib/catalog-health-summary'

type Density = 'compact' | 'comfortable' | 'large'
export function CatalogHealthDashboard({ stats, checkedAt }: { stats: BrandFeedStats[]; checkedAt: string }) {
  const [density, setDensity] = useState<Density>('comfortable')
  const [query, setQuery] = useState('')
  const [attention, setAttention] = useState(false)
  const router = useRouter()
  const totals = summarizeCatalog(stats)
  const filtered = filterCatalogBrands(stats, query, attention)
  const cell = density === 'compact' ? 'p-2 text-xs' : density === 'large' ? 'p-5 text-base' : 'p-3 text-sm'
  return <section aria-labelledby="catalog-health-title" className="space-y-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-5 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">AUAPW Catalog Control</p><h2 id="catalog-health-title" className="mt-1 text-2xl font-bold">Brand health & editing</h2><p className="mt-1 text-xs text-muted-foreground">Computed {new Date(checkedAt).toLocaleString()}. This is not a successful Google sync timestamp.</p></div>
      <button type="button" onClick={() => router.refresh()} className="rounded-lg border bg-background px-4 py-2 text-sm">Refresh counts</button>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Catalog records', totals.total, 'Includes hidden records'],
        ['Visible website products', totals.visible, 'Excludes hidden products'],
        ['Feed-eligible products', totals.eligible, 'Not confirmed Google acceptance'],
        ['Missing prices', totals.missingPrices, 'Quote-only; not feed-eligible'],
      ].map(([label, value, note]) => <article key={label} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md motion-reduce:transition-none"><p className="text-xs text-muted-foreground">{label}</p><p className="my-2 text-3xl font-bold tabular-nums">{Number(value).toLocaleString('en-US')}</p><p className="text-xs text-muted-foreground">{note}</p></article>)}
    </div>
    <p className="text-sm">{totals.imageReviews.toLocaleString()} generated-image flags require review. Issue counts can overlap; do not add them to calculate unique affected products. Google accepted/rejected counts and external publishing status are unavailable without account authorization.</p>
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">Find brand<input value={query} onChange={event => setQuery(event.target.value)} className="rounded border bg-background px-3 py-2" /></label>
      <label className="flex flex-col gap-1 text-sm">Display size<select value={density} onChange={event => setDensity(event.target.value as Density)} className="rounded border bg-background px-3 py-2"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label>
      <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" checked={attention} onChange={event => setAttention(event.target.checked)} />Needs review only</label>
      <p role="status" className="py-2 text-sm text-muted-foreground">{filtered.length} of {stats.length} brands</p>
    </div>
    <div className="max-h-[36rem] overflow-auto rounded-xl border bg-card">
      <table className="w-full text-left tabular-nums"><caption className="sr-only">Catalog health and editing links by brand</caption><thead className="sticky top-0 bg-card"><tr>{['Brand', 'Records', 'Visible', 'Feed eligible', 'No price', 'Hidden', 'Image review', 'Actions'].map(label => <th key={label} scope="col" className={cell}>{label}</th>)}</tr></thead>
        <tbody>{filtered.map(brand => <tr key={brand.slug} className="border-t transition-colors hover:bg-muted/60 motion-reduce:transition-none">
          <th scope="row" className={cell}>{brand.label}</th>
          {[brand.total, brand.total - brand.issues.hidden, brand.eligible, brand.issues.no_price, brand.issues.hidden, brand.issues.illustrative_image].map((value, index) => <td key={index} className={cell}>{value.toLocaleString('en-US')}</td>)}
          <td className={`${cell} min-w-52`}><div className="flex flex-wrap gap-2"><Link href={`/admin/products?brand=${brand.slug}#fix-pages`} className="underline">Edit products</Link><Link href={`/admin/products?brand=${brand.slug}#catalog-upload`} className="underline">Upload</Link><Link href={`/admin/products?brand=${brand.slug}&issue=no_price#fix-pages`} className="underline">Fix prices</Link><Link href={`/admin/products?brand=${brand.slug}&issue=illustrative_image#fix-pages`} className="underline">Review images</Link></div></td>
        </tr>)}</tbody>
      </table>
      {!filtered.length && <p className="p-5 text-sm">No brands match these filters.</p>}
    </div>
    <p className="text-xs text-muted-foreground">Use the product editor for individual fixes and the existing confirmed bulk controls for uploaded/manual records. This view never deletes products or changes Merchant Center settings. Stock totals, duplicate-SKU auditing, column mapping and full brand replacement are not implemented here.</p>
  </section>
}
