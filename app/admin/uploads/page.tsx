import { SheetDashboardActions } from '@/components/admin/merchant/sheet-dashboard-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { BRAND_DIRECTORY } from '@/lib/brand-catalog'
import { SITE_URL, FEED_PATH, MERCHANT_CENTER_ID } from '@/lib/merchant'
import { UploadMonitor } from '@/components/admin/merchant/upload-monitor'
import { LargeCatalogUpload } from '@/components/admin/merchant/large-catalog-upload'

export const dynamic = 'force-dynamic'

function ConnectionCard({ title, description, status, href, action, detail }: {
 title: string; description: string; status: string; href: string; action: string; detail: string
}) {
 return <article className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border bg-card p-5">
  <div className="flex items-start justify-between gap-3">
   <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
   <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">{status}</span>
  </div>
  <p className="break-all rounded-lg bg-muted/50 p-3 text-xs">{detail}</p>
  <Link href={href} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{action} ↗</Link>
 </article>
}

export default async function UploadWorkspace() {
 if(!(await getAdminSession()))redirect('/admin/login')
 const brands=BRAND_DIRECTORY.map(({slug,label})=>({slug,label}))
 const feedUrl = SITE_URL + FEED_PATH
 return <div className="mx-auto max-w-7xl space-y-7 px-1">
  <header className="flex flex-col justify-between gap-3 border-b pb-5 sm:flex-row sm:items-end">
   <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">AUAPW operations</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Product Upload Dashboard</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Import spreadsheet data into the saved catalog, review feed readiness, then verify delivery in each external platform.</p></div>
   <Link href="/admin/merchant" className="rounded-lg border px-4 py-2 text-sm font-medium">Open Merchant dashboard →</Link>
  </header>
  <section className="space-y-3">
   <div><h2 className="text-lg font-semibold">Connections & delivery</h2><p className="text-sm text-muted-foreground">Feed generation and external account authorization are separate. This page does not mark an external account connected unless authorization and delivery can actually be verified.</p></div>
   <div className="grid gap-4 lg:grid-cols-2">
    <ConnectionCard title="Google Merchant Center" description="AUAPW generates a Google Shopping XML feed. Account-level fetch and product approval must be verified inside Merchant Center." status="Account sync unverified" href="https://merchants.google.com/" action="Open Merchant Center" detail={`Feed endpoint: ${feedUrl} · Merchant ID configured in app: ${MERCHANT_CENTER_ID}`} />
    <ConnectionCard title="ChatGPT Ads" description="A separate product-feed connection and authorization are required. The current repository does not implement a verified external sync for this channel." status="Not connected in app" href="https://ads.openai.com/" action="Open ChatGPT Ads" detail="No verified API connection, sync timestamp, or delivery result is available to display yet." />
   </div>
   <p className="text-xs text-muted-foreground">These cards are transparent status links, not proof of successful external delivery. Do not paste API secrets into this page. A real connection requires authorized credentials and a server-side integration.</p>
  </section>
  <section className="space-y-3"><h2 className="text-lg font-semibold">Catalog health</h2><UploadMonitor/></section>
  <section id="sheet-preview" className="space-y-4 rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">Upload → preview → confirm import</h2><p className="text-sm text-muted-foreground">One upload workflow for all sheet sizes. Files transfer directly to private storage, not through the small form request limit. Uploading alone never imports products.</p><LargeCatalogUpload brands={brands}/></section>

  <SheetDashboardActions/>

 </div>
}
