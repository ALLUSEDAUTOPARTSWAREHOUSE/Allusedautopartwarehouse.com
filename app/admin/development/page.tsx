import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { checkEnvironment } from '@/lib/admin-health'
import { IntegrationSetup } from '@/components/admin/integration-setup'
import { Bot, CreditCard, Facebook, Store, Globe, ShieldCheck, ArrowUpRight, Users } from 'lucide-react'
export const dynamic = 'force-dynamic'
export default async function Workspace() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="rounded-2xl border bg-card p-6">
      <p className="text-xs font-semibold tracking-widest text-primary">DEVELOPMENT CONTROL CENTER</p>
      <h1 className="mt-2 text-3xl font-bold">APIs, integrations & website development</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Use one place to configure integrations, check required environment variables, and describe new features or website fixes to the AI assistant. Secret values stay in Vercel, not in this dashboard.</p>
      <Link href="/admin/ai-chat" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Bot className="size-4" /> Open AI development assistant <ArrowUpRight className="size-4" /></Link>
    </header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { href: '/admin/merchant', label: 'Google Merchant Center', detail: 'Feed health and product diagnostics', icon: Store },
        { href: '/admin/marketing/social', label: 'Social accounts', detail: 'Provider authorization setup', icon: Facebook },
        { href: '/admin/payments', label: 'Payment methods', detail: 'Gateways and checkout configuration', icon: CreditCard },
        { href: '/admin/products', label: 'Website product pages', detail: 'Catalog, prices, images and content', icon: Globe },
        { href: '/admin/settings', label: 'System health & settings', detail: 'Database and environment readiness', icon: ShieldCheck },
        { href: '/admin/team', label: 'Team directory', detail: 'Sales, support and developer team', icon: Users },
      ].map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted">
        <Icon className="mt-0.5 size-5 text-primary" /><span><span className="block font-semibold">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{detail}</span></span><ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </Link>)}
    </section>
    <IntegrationSetup checks={checkEnvironment()} />
  </div>
}
