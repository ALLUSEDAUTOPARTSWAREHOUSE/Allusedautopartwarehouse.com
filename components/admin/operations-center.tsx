import Link from 'next/link'
import type { EnvCheck } from '@/lib/admin-health'

const MODULES = [
  { href: '/admin/products', title: 'Products & inventory', description: 'Import spreadsheets, filter products, update prices and images, and manage selected uploaded products.' },
  { href: '/admin/orders', title: 'Orders & fulfillment', description: 'Review orders and track customer follow-up.' },
  { href: '/admin/quotes', title: 'Quotes & opportunities', description: 'Review incoming parts requests and prepare quotes.' },
  { href: '/admin/merchant', title: 'Google Feed Dashboard', description: 'Monitor feed eligibility, issues and Google fetch history.' },
  { href: '/admin/customers', title: 'Customers', description: 'Review existing customer records.' },
  { href: '/admin/payments', title: 'Payments', description: 'Manage payment methods and checkout configuration.' },
  { href: '/admin/chats', title: 'Customer conversations', description: 'Review messages and follow up with customers.' },
  { href: '/admin/team', title: 'Team directory', description: 'Manage staff directory records. Directory entries do not grant portal access.' },
] as const

export function OperationsCenter({ checks }: { checks: EnvCheck[] }) {
  const missing = checks.filter(check => !check.set)
  return (
    <section aria-labelledby="operations-heading" className="mx-auto w-full max-w-7xl space-y-5">
      <header>
        <h2 id="operations-heading" className="text-xl font-bold">Automotive operations control center</h2>
        <p className="text-sm text-muted-foreground">Manage the business from focused workspaces. Product edits refresh the website; Google updates on its next feed fetch.</p>
      </header>
      <nav aria-label="Four business dashboards" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/admin/products', title: '1 · Products', color: 'border-indigo-500', text: 'Brands, uploads, prices, images and product fixes' },
          { href: '/admin/sales', title: '2 · Sales & Support', color: 'border-teal-500', text: 'Customers, chats, leads, quotes and orders' },
          { href: '/admin/development', title: '3 · Site & Settings', color: 'border-violet-500', text: 'System settings, team directory and AI planning' },
          { href: '/admin/marketing', title: '4 · Marketing', color: 'border-amber-500', text: 'Merchant feed, reviews and social integration status' },
        ].map(area => <Link key={area.href} href={area.href} className={`rounded-xl border-l-4 bg-card p-5 ${area.color}`}>
          <h3 className="font-bold">{area.title}</h3><p className="mt-2 text-sm text-muted-foreground">{area.text}</p>
        </Link>)}
      </nav>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map(module => (
          <Link key={module.href} href={module.href} className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted focus-visible:outline">
            <h3 className="font-semibold">{module.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
          </Link>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold">Configuration readiness</h3>
        <p className="text-sm text-muted-foreground">Configuration presence only—not a test of email delivery, payment processing, database access or AI replies. Secret values are never displayed.</p>
        {missing.length ? <ul className="mt-3 space-y-2">
          {missing.map(check => <li key={check.name} className="text-sm">
            <span className="font-medium">{check.name}</span> — {check.required ? 'Required configuration missing' : 'Optional configuration missing'}: {check.purpose}
          </li>)}
        </ul> : <p className="mt-3 text-sm">All checked configuration names are present. Verify each integration before using it.</p>}
        <Link href="/admin/settings" className="mt-3 inline-block text-sm text-primary underline">Open settings and system checks</Link>
      </div>
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Access and AI boundaries</h3>
        <p className="text-sm text-muted-foreground">The store assistant searches business records using its existing tools. Changes require approval. Email invitations, separate customer/supplier/staff permissions, saved AI memory and uploaded-knowledge indexing are not implemented. Never share the admin password with portal users.</p>
      </div>
    </section>
  )
}
