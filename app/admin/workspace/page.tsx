import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import {
  ArrowUpRight, Boxes, ChartNoAxesCombined, CreditCard, Facebook, Gauge,
  Headset, Megaphone, Package, Settings2, ShieldCheck, ShoppingBag, Store,
  Users, Workflow, Bot, KeyRound, PlugZap, Globe,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Workspace | AUAPW', robots: { index: false, follow: false } }

const workspaces = [
  {
    title: 'Commerce & inventory',
    description: 'Manage automotive parts, catalog quality, availability, and product publishing.',
    icon: Boxes,
    links: [
      { label: 'Products & brands', href: '/admin/products', icon: Package },
      { label: 'Orders & fulfilment', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Google Merchant Center',
    description: 'Review feed operations, product diagnostics, and Merchant Center setup.',
    icon: Store,
    links: [
      { label: 'Merchant dashboard', href: '/admin/merchant', icon: Store },
      { label: 'Marketing overview', href: '/admin/marketing', icon: ChartNoAxesCombined },
      { label: 'Google reviews', href: '/admin/marketing/reviews', icon: ShieldCheck },
    ],
  },
  {
    title: 'Social & growth',
    description: 'Coordinate social account links, marketing activity, and customer reputation.',
    icon: Megaphone,
    links: [
      { label: 'Social accounts', href: '/admin/marketing/social', icon: Facebook },
      { label: 'Marketing dashboard', href: '/admin/marketing', icon: Megaphone },
      { label: 'System settings', href: '/admin/settings', icon: Settings2 },
    ],
  },
  {
    title: 'Sales & customer support',
    description: 'Keep sales, quote requests, customer conversations, and team workflows together.',
    icon: Headset,
    links: [
      { label: 'Sales dashboard', href: '/admin/sales', icon: ChartNoAxesCombined },
      { label: 'Leads & quotes', href: '/admin/quotes', icon: Workflow },
      { label: 'Customer chats', href: '/admin/chats', icon: Headset },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Team members', href: '/admin/team', icon: Users },
    ],
  },
  {
    title: 'AI development, APIs & security',
    description: 'Plan website page changes, new features, bug fixes and API integrations, then manage settings and access.',
    icon: Bot,
    links: [
      { label: 'AI development assistant', href: '/admin/ai-chat', icon: Bot },
      { label: 'API & integration setup', href: '/admin/development', icon: PlugZap },
      { label: 'Website products & content', href: '/admin/products', icon: Globe },
      { label: 'System health & settings', href: '/admin/settings', icon: Settings2 },
      { label: 'Password management', href: '/admin/security', icon: KeyRound },
    ],
  },
]

export default async function AdminWorkspacePage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Gauge className="size-3.5" /> ADMINISTRATOR WORKSPACE
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">One command center. Five workspaces.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage store and inventory, Google Merchant, social accounts, payment methods, sales support, API setup, security and AI-assisted development from one secure admin portal.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Open control center <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">
                Configure workspace <Settings2 className="size-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold">Operations at a glance</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Open each workspace to view its connected records and tools. Live totals are intentionally not fabricated on this landing page.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['01', 'Store & inventory'],
                ['02', 'Google Merchant'],
                ['03', 'Social & growth'],
                ['04', 'Sales & support'],
                ['05', 'AI & API development'],
              ].map(([n, label]) => (
                <div key={n} className="rounded-lg border border-border bg-card p-3">
                  <span className="text-xs font-semibold text-primary">{n}</span>
                  <p className="mt-1 text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your workspaces</h2>
            <p className="mt-1 text-sm text-muted-foreground">Direct access to commerce, marketing, payment, development and security tools.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex"><ShieldCheck className="size-4" /> Admin access required</span>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {workspaces.map((workspace, index) => {
            const Icon = workspace.icon
            return (
              <article key={workspace.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><Icon className="size-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{workspace.title}</h3>
                      <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{workspace.description}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {workspace.links.map(({ label, href, icon: LinkIcon }) => (
                    <Link key={href + label} href={href} className="group flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted/60">
                      <span className="flex min-w-0 items-center gap-2.5"><LinkIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" /><span>{label}</span></span>
                      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
        API keys and payment secrets belong in Vercel Environment Variables, never in chat or ordinary forms. Social publishing and direct Google Merchant account authorization require provider connections. AI can help plan code changes; changes must be reviewed and deployed before they affect the live website.
      </p>
    </div>
  )
}
