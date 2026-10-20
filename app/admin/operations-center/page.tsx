import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, Boxes, CheckCircle2,
  Code2, Database, Headset, MessageSquare, Package, ShieldCheck,
  ShoppingCart, Wrench, XCircle,
} from 'lucide-react'
import { getAdminSession } from '@/lib/admin-auth'
import { checkDatabase, checkEnvironment } from '@/lib/admin-health'
import { AssistantPanel } from '@/components/admin/assistant-panel'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'AI Operations Center | AUAPW Admin',
  robots: { index: false, follow: false },
}

const workspaces = [
  { title: 'Sales & orders', detail: 'Order status, quote leads, follow-up queue and team assignments.', href: '/admin/sales', icon: ShoppingCart },
  { title: 'Customer chats', detail: 'Review incoming conversations and customer-service follow-ups.', href: '/admin/chats', icon: MessageSquare },
  { title: 'Catalog & missing data', detail: 'Find missing prices, descriptions, images and product feed issues.', href: '/admin/products', icon: Package },
  { title: 'Google Merchant', detail: 'Inspect feed eligibility, fetch history and product diagnostics.', href: '/admin/merchant', icon: Boxes },
  { title: 'Website settings & health', detail: 'Review database tables, required settings and configuration status.', href: '/admin/settings', icon: Database },
  { title: 'Development & integrations', detail: 'Plan fixes, review integrations and prepare changes for review.', href: '/admin/development', icon: Code2 },
]

export default async function OperationsCenterPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const [environment, tables] = await Promise.all([
    Promise.resolve(checkEnvironment()),
    checkDatabase(),
  ])
  const missingRequired = environment.filter((item) => item.required && !item.set)
  const brokenTables = tables.filter((table) => !table.ok)
  const healthyTables = tables.filter((table) => table.ok)
  const totalRows = healthyTables.reduce((sum, table) => sum + (table.rows ?? 0), 0)
  const checkedAt = new Date().toISOString()
  const systemReady = missingRequired.length === 0 && brokenTables.length === 0

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_.6fr] lg:items-center lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Bot className="size-3.5" /> AUAPW AI OPERATIONS
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">One place to run the business</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Ask the AI to investigate recorded sales, quote requests, chats, product data and Google feed issues; plan website fixes; and explain health-check errors. Live tools use AUAPW records where available and report unavailable sources rather than inventing results.
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Admin-only. Production deployments, destructive data changes and customer-facing messages remain human-approved. This page does not claim a deployment occurred.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {systemReady ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertTriangle className="size-5 text-amber-600" />}
              Current configuration check
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{healthyTables.length}/{tables.length}</p>
            <p className="text-xs text-muted-foreground">Database checks passed</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-2xl font-bold tabular-nums">{missingRequired.length}</p>
                <p className="text-xs text-muted-foreground">Required settings missing</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-2xl font-bold tabular-nums">{brokenTables.length}</p>
                <p className="text-xs text-muted-foreground">Database checks failing</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Checked {new Date(checkedAt).toLocaleString()} · {totalRows.toLocaleString()} rows across readable tables (not a unique-record total).</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Operations workspaces">
        {workspaces.map(({ title, detail, href, icon: Icon }) => (
          <Link key={title} href={href} className="group flex gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/30">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold">{title}<ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" /></span>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">{detail}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
        <div className="min-w-0 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <Activity className="size-5 text-primary" />
            <div>
              <h2 className="font-semibold">Live diagnostics</h2>
              <p className="text-xs text-muted-foreground">Current server-side checks; secrets are never displayed.</p>
            </div>
          </div>
          <div className="border-b border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">Required settings</h3>
            {environment.filter(item => item.required).map(item => (
              <div key={item.name} className="flex items-start gap-2 border-t border-border/60 py-2.5 text-sm first:border-0">
                {item.set ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.purpose}</p>
                </div>
                <span className={item.set ? 'text-xs text-emerald-600' : 'text-xs font-semibold text-destructive'}>{item.set ? 'Present' : 'Missing'}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Database tables</h3>
            <div className="space-y-2">
              {tables.map(table => (
                <details key={table.table} className="rounded-lg border border-border">
                  <summary className="flex cursor-pointer list-none items-start gap-2 p-3">
                    {table.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{table.table}</span>
                      <span className="block text-xs text-muted-foreground">{table.purpose}</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{table.ok ? `${(table.rows ?? 0).toLocaleString()} rows` : 'Error'}</span>
                  </summary>
                  {!table.ok && <div className="border-t border-border bg-destructive/5 p-3 text-xs text-destructive"><strong>Diagnostic:</strong> {table.error || 'Database query failed.'}</div>}
                </details>
              ))}
            </div>
          </div>
          <div className="border-t border-border p-4 text-xs text-muted-foreground">
            These are configuration-presence and database-schema checks, not a complete external uptime test. Provider credentials, Netlify deploy state and Google/AI provider authorization are not verified by this panel.
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-primary" />
              <h2 className="font-semibold">Production change workflow</h2>
            </div>
            <ol className="mt-3 space-y-3 text-sm">
              <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">1</span><span><strong>Investigate</strong><span className="block text-xs text-muted-foreground">Collect the failing route, exact error, recent changes and data source.</span></span></li>
              <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">2</span><span><strong>Build and test</strong><span className="block text-xs text-muted-foreground">Create a reviewable Git change and run type-check, tests and production build.</span></span></li>
              <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">3</span><span><strong>Review before release</strong><span className="block text-xs text-muted-foreground">Verify Netlify preview and obtain approval before merging or promoting production.</span></span></li>
            </ol>
            <Link href="/admin/development" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">Open development controls <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Headset className="size-5 text-primary" />
              <h2 className="font-semibold">Ask the AI operations agent</h2>
            </div>
            <p className="mb-3 text-xs leading-5 text-muted-foreground">Try: “Find missing product prices”, “Summarize sales and unread chats”, “Explain the failing database check”, or “Prepare a Netlify-safe fix plan”.</p>
            <Link href="/admin/ai-chat" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Open full AI workspace <ArrowUpRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section aria-label="AI operations chat" className="space-y-2">
        <div className="flex items-center gap-2"><Bot className="size-5 text-primary" /><h2 className="text-xl font-semibold">Operations chat</h2></div>
        <p className="text-sm text-muted-foreground">Ask questions about connected business records. Actions that change product data are approval-gated; sending customer messages and production deployment are not automatic.</p>
        <AssistantPanel layout="full" />
      </section>
    </div>
  )
}
