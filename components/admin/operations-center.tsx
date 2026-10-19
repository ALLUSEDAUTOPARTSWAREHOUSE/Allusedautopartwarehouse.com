import Link from 'next/link'
import { ArrowUpRight, Boxes, Bot, CreditCard, LifeBuoy, Megaphone, PackageSearch, Settings2, ShieldCheck, ShoppingCart, Users, Wrench } from 'lucide-react'
import type { EnvCheck } from '@/lib/admin-health'

const WORKSPACES = [
  { href: '/admin/products', eyebrow: 'CATALOG', title: 'Products & inventory', description: 'Import products, update prices and images, and review catalog data.', icon: Boxes, tone: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300' },
  { href: '/admin/sales', eyebrow: 'CUSTOMER OPERATIONS', title: 'Sales & support', description: 'Work with orders, quote requests, customer messages and follow-ups.', icon: LifeBuoy, tone: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300' },
  { href: '/admin/marketing', eyebrow: 'GROWTH', title: 'Marketing & feeds', description: 'Review product-feed tools, marketing channels and integration status.', icon: Megaphone, tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300' },
  { href: '/admin/development', eyebrow: 'PLATFORM', title: 'Website & development', description: 'Open development tools, team workspace and AI-assisted planning.', icon: Wrench, tone: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300' },
] as const

const MODULES = [
  { href: '/admin/products', title: 'Product catalog', description: 'Bulk uploads, pricing, images and inventory.', icon: PackageSearch },
  { href: '/admin/orders', title: 'Orders & fulfillment', description: 'Review order status and next actions.', icon: ShoppingCart },
  { href: '/admin/quotes', title: 'Quotes & opportunities', description: 'Manage incoming parts requests and quotes.', icon: ArrowUpRight },
  { href: '/admin/merchant', title: 'Google Merchant feed', description: 'Inspect eligibility, feed issues and fetch history.', icon: Boxes },
  { href: '/admin/customers', title: 'Customers', description: 'Find customer records and order context.', icon: Users },
  { href: '/admin/payments', title: 'Payments & checkout', description: 'Review payment and checkout configuration.', icon: CreditCard },
  { href: '/admin/chats', title: 'Customer conversations', description: 'Review messages and coordinate follow-ups.', icon: LifeBuoy },
  { href: '/admin/team', title: 'Team directory', description: 'Review staff directory records and roles.', icon: Users },
  { href: '/admin/ai-chat', title: 'AI support assistant', description: 'Draft replies and plans for human review.', icon: Bot },
  { href: '/admin/settings', title: 'System settings', description: 'Review environment and service readiness.', icon: Settings2 },
] as const

export function OperationsCenter({ checks }: { checks: EnvCheck[] }) {
  const missing = checks.filter(check => !check.set)

  return (
    <section aria-labelledby="operations-heading" className="mx-auto w-full max-w-[1440px] space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white shadow-sm sm:px-8 lg:px-10 lg:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-14 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-slate-200">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            ALL USED AUTO PARTS WAREHOUSE
          </div>
          <h2 id="operations-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Your operations, in one place.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Manage your catalog, customer operations and growth tools from one workspace. Choose an area below to get started.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">Manage products <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">System health <Settings2 className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspaces</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Choose a business area</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WORKSPACES.map(area => {
            const Icon = area.icon
            return (
              <Link key={area.href} href={area.href} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <div className="flex items-start justify-between gap-3">
                  <span className={'inline-flex h-11 w-11 items-center justify-center rounded-xl border ' + area.tone}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[10px] font-bold tracking-[0.16em] text-muted-foreground">{area.eyebrow}</p>
                <h4 className="mt-1 text-base font-semibold text-foreground">{area.title}</h4>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{area.description}</p>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quick access</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Tools & administration</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {MODULES.map(module => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href} className="group flex min-h-32 gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{module.title}</span><span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{module.description}</span></span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="readiness-heading">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
            <div><h3 id="readiness-heading" className="font-semibold text-foreground">Configuration readiness</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Checks whether configuration names are present. This does not prove a service is working, and secret values are never displayed.</p></div>
          </div>
          {missing.length ? <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
            {missing.map(check => <li key={check.name} className="flex flex-wrap items-start justify-between gap-2 px-3 py-3 text-sm">
              <span className="min-w-0"><span className="font-medium text-foreground">{check.name}</span><span className="mt-1 block text-xs text-muted-foreground">{check.purpose}</span></span>
              <span className={'rounded-full px-2.5 py-1 text-xs font-medium ' + (check.required ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-muted text-muted-foreground')}>{check.required ? 'Required missing' : 'Optional'}</span>
            </li>)}
          </ul> : <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">All checked configuration names are present. Verify each integration before using it.</p>}
          <Link href="/admin/settings" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Review system health <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="connections-heading">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><Megaphone className="h-5 w-5" aria-hidden="true" /></span>
            <div><h3 id="connections-heading" className="font-semibold text-foreground">Feeds & connected services</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Open each service to review its current setup. A dashboard link is not the same as an active connection or a completed sync.</p></div>
          </div>
          <div className="mt-5 space-y-3">
            <Link href="/admin/merchant" className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/40"><span><span className="block text-sm font-medium text-foreground">Google Merchant Center</span><span className="mt-1 block text-xs text-muted-foreground">Product feed status and diagnostics</span></span><span className="text-xs font-medium text-muted-foreground">View feed <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></span></Link>
            <Link href="/admin/ads" className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/40"><span><span className="block text-sm font-medium text-foreground">Advertising control center</span><span className="mt-1 block text-xs text-muted-foreground">Review feed destinations and campaign planning</span></span><span className="text-xs font-medium text-muted-foreground">Open ads <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></span></Link>
            <p className="text-xs leading-5 text-muted-foreground">Live sync, account authorization and campaign publishing must be configured and verified separately.</p>
          </div>
        </section>
      </div>
    </section>
  )
}
