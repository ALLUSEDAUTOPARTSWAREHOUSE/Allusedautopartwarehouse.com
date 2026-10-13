import Link from 'next/link'
import type { EnvCheck } from '@/lib/admin-health'

const SETTINGS_URL = 'https://vercel.com/auapw/allusedautopartwarehouse-com/settings/environment-variables'
const INTEGRATIONS = [
  { title: 'Email delivery', names: ['RESEND_API_KEY', 'EMAIL_FROM or RESEND_EMAIL_DOMAIN'], description: 'Existing notification service. Configure a verified sending domain; delivery still needs testing.' },
  { title: 'Payments', names: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'], description: 'Existing checkout configuration. Verify webhook delivery and test payments before accepting orders.' },
  { title: 'AI assistant', names: ['AI_GATEWAY_API_KEY (or Vercel OIDC)'], description: 'Existing assistant tools. Authentication presence does not confirm model access or available credit.' },
  { title: 'Scheduled reports', names: ['CRON_SECRET'], description: 'Existing scheduler authentication. Review deployed schedules and test report delivery.' },
] as const

export function IntegrationSetup({ checks }: { checks: EnvCheck[] }) {
  return <section aria-labelledby="integration-heading" className="space-y-4">
    <h2 id="integration-heading" className="text-xl font-semibold">API & integration setup</h2>
    <p className="text-sm text-muted-foreground">Add credentials later using protected environment settings. This dashboard never displays keys. Configuration presence is not a connection test.</p>
    <div className="grid gap-4 md:grid-cols-2">
      {INTEGRATIONS.map(service => <article key={service.title} className="rounded-xl border border-l-4 border-l-indigo-500 bg-card p-5">
        <h3 className="font-semibold">{service.title}</h3>
        <p className="my-2 text-sm text-muted-foreground">{service.description}</p>
        <ul className="space-y-2 text-sm">{service.names.map(name => {
          const check = checks.find(item => item.name === name)
          return <li key={name}><code className="break-all">{name}</code><span className={`ml-2 rounded px-2 py-1 text-xs ${check?.set ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}>{check?.set ? 'Configured · untested' : 'Not configured'}</span></li>
        })}</ul>
        <a href={SETTINGS_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded border px-3 py-2 text-sm">Configure in Vercel ↗</a>
      </article>)}
      {['Google Merchant direct upload', 'Google Business Profile reviews', 'Social account publishing', 'User invitations & portal permissions', 'Saved AI memory & knowledge indexing'].map(title => <article key={title} className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold">{title}</h3>
        <span className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs">Integration not implemented</span>
        <p className="mt-2 text-sm text-muted-foreground">Setup workspace reserved. Credentials alone will not enable this feature; authorization, backend implementation and testing are required.</p>
      </article>)}
    </div>
    <div className="rounded-xl border p-5">
      <h3 className="font-semibold">Code & page changes</h3>
      <p className="mt-2 text-sm text-muted-foreground">Code changes belong in reviewed repository changes, not executable dashboard fields. Use AI planning for draft requirements; it cannot execute code or deploy. A page builder and API endpoint editor are not implemented.</p>
      <Link href="/admin/ai-chat" className="mt-3 inline-block rounded border px-3 py-2 text-sm">Open AI planning</Link>
    </div>
  </section>
}
