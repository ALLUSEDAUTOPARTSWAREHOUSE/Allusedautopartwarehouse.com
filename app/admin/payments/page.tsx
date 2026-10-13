import Link from 'next/link'
import { checkEnvironment } from '@/lib/admin-health'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { PaymentGatewaysClient } from '@/components/admin/payment-gateways-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Payment Gateways | Admin',
  description: 'Manage payment methods and gateways',
}

export default async function AdminPaymentsPage() {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const checks = checkEnvironment()
  const configuration = [
    { key: 'STRIPE_SECRET_KEY', title: 'Payment processing', description: 'Server-side Stripe configuration' },
    { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', title: 'Checkout card form', description: 'Public checkout configuration' },
    { key: 'STRIPE_WEBHOOK_SECRET', title: 'Payment confirmation', description: 'Stripe webhook configuration' },
  ]
  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-2xl border bg-card p-6">
      <p className="text-xs font-semibold tracking-widest text-primary">FINANCE WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-bold">Payments dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage checkout methods and review integration readiness. Configuration is not a verified connection.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/admin/orders" className="rounded-lg border px-4 py-2 text-sm">Review orders</Link>
        <Link href="/admin/development" className="rounded-lg border px-4 py-2 text-sm">API setup</Link>
      </div>
    </header>
    <div className="grid gap-4 md:grid-cols-3">
      {configuration.map(item => {
        const configured = checks.find(check => check.name === item.key)?.set
        return <section key={item.key} className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">{item.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          <p className={`mt-4 inline-block rounded-full px-3 py-1 text-xs ${configured ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}>{configured ? 'Configured · untested' : 'Not configured'}</p>
        </section>
      })}
    </div>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Balances, settlements & refunds</h2>
      <p className="mt-2 text-sm text-muted-foreground">Provider balances, payout history and refund actions are not integrated. Order totals are not bank balances or confirmed settlements.</p>
      <button type="button" disabled className="mt-3 rounded-lg border px-4 py-2 text-sm opacity-50">Settlement report — not available</button>
    </section>
    <PaymentGatewaysClient />
  </div>
}
