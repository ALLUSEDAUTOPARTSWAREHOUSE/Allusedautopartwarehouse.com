import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { BRAND_DIRECTORY } from '@/lib/brand-catalog'
import { UploadSheetForm } from '@/components/admin/merchant/catalog-sync-panel'
import { LargeCatalogUpload } from '@/components/admin/merchant/large-catalog-upload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Spreadsheet uploads | AUAPW Admin', robots: { index: false, follow: false } }

export default async function UploadsPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  if (!(await getAdminSession())) redirect('/admin/login')
  const { brand } = await searchParams
  const selected = BRAND_DIRECTORY.find(item => item.slug === brand)
  const brands = (selected ? [selected] : BRAND_DIRECTORY).map(({ slug, label }) => ({ slug, label }))
  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
    <header className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dedicated upload workspace</p>
      <h1 className="mt-2 text-3xl font-bold">{selected ? `${selected.label} spreadsheet uploads` : 'Spreadsheet uploads'}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Upload here without scrolling through product records. Uploading does not delete unmatched old products.</p>
      <nav className="mt-4 flex flex-wrap gap-4 text-sm"><Link href="/admin/products" className="underline">Back to products</Link>{selected && <Link href="/admin/uploads" className="underline">All brands</Link>}</nav>
    </header>
    <LargeCatalogUpload brands={brands} />
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Existing small-file import</h2>
      <p className="text-sm text-muted-foreground">This legacy form still uses the small Server Action upload path. Files over 1 MB can fail on deployments with the default limit. Use staging above for larger files; staging is not an automatic import.</p>
      <UploadSheetForm brands={brands} />
    </section>
  </div>
}
