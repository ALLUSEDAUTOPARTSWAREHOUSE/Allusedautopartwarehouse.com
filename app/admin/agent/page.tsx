import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminAgentPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Development operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">eve agent</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Monitor the AUAPW business agent, website health, orders, and development workflows from one admin workspace.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Agent health', '/eve/v1/health', 'Runtime readiness endpoint'],
          ['Agent info', '/eve/v1/info', 'Tools and capabilities'],
          ['Orders', '/admin/orders', 'Review order status'],
          ['Website status', '/admin/development', 'API and setup checks'],
        ].map(([label, href, detail]) => (
          <a key={label} href={href} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted">
            <p className="font-semibold">{label}</p>
            <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
            <p className="mt-5 text-xs font-medium text-primary">Open →</p>
          </a>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Available agent functions</h2>
        <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <li>Check website and business availability</li>
          <li>Review order status and next actions</li>
          <li>Inspect development environment health</li>
          <li>Summarize business operations for admins</li>
        </ul>
      </div>
    </div>
  )
}
